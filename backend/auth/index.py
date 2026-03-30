import json
import os
import psycopg2  # noqa


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ['MAIN_DB_SCHEMA']}")


def handler(event: dict, context) -> dict:
    """Авторизация пользователей (учитель и ученики)"""
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

    body = json.loads(event.get("body") or "{}")
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()

    if not username or not password:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Введите логин и пароль"}),
        }

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, full_name, role FROM users WHERE username = %s AND password_hash = %s",
        (username, password),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {
            "statusCode": 401,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Неверный логин или пароль"}),
        }

    user_id, full_name, role = row
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"id": user_id, "full_name": full_name, "role": role, "username": username}),
    }