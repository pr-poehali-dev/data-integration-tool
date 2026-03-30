import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ['MAIN_DB_SCHEMA']}")


def handler(event: dict, context) -> dict:
    """Управление учениками: список, создание"""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    method = event.get("httpMethod")
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute("SELECT id, username, full_name FROM users WHERE role = 'student' ORDER BY full_name")
        rows = cur.fetchall()
        conn.close()
        students = [{"id": r[0], "username": r[1], "full_name": r[2]} for r in rows]
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"students": students}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()
        full_name = body.get("full_name", "").strip()

        if not username or not password or not full_name:
            conn.close()
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Заполните все поля"}),
            }

        cur.execute(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (%s, %s, 'student', %s) RETURNING id",
            (username, password, full_name),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {
            "statusCode": 201,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"id": new_id, "username": username, "full_name": full_name}),
        }

    conn.close()
    return {"statusCode": 405, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}
