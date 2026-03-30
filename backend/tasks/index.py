import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={os.environ['MAIN_DB_SCHEMA']}")


def handler(event: dict, context) -> dict:
    """Управление заданиями: список, создание, обновление статуса и комментария"""
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
    params = event.get("queryStringParameters") or {}
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        student_id = params.get("student_id")
        teacher_id = params.get("teacher_id")

        if student_id:
            cur.execute(
                """SELECT t.id, t.title, t.description, t.task_type, t.status,
                          t.student_answer, t.teacher_comment, t.created_at,
                          u.full_name as teacher_name
                   FROM tasks t JOIN users u ON u.id = t.teacher_id
                   WHERE t.student_id = %s ORDER BY t.created_at DESC""",
                (student_id,),
            )
        elif teacher_id:
            cur.execute(
                """SELECT t.id, t.title, t.description, t.task_type, t.status,
                          t.student_answer, t.teacher_comment, t.created_at,
                          u.full_name as student_name, t.student_id
                   FROM tasks t JOIN users u ON u.id = t.student_id
                   WHERE t.teacher_id = %s ORDER BY t.created_at DESC""",
                (teacher_id,),
            )
        else:
            conn.close()
            return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Укажите student_id или teacher_id"})}

        rows = cur.fetchall()
        conn.close()
        cols = [d[0] for d in cur.description]
        tasks = [dict(zip(cols, r)) for r in rows]
        for t in tasks:
            if t.get("created_at"):
                t["created_at"] = t["created_at"].isoformat()
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"tasks": tasks}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        student_id = body.get("student_id")
        teacher_id = body.get("teacher_id")
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        task_type = body.get("task_type", "Другое").strip()

        if not all([student_id, teacher_id, title, description]):
            conn.close()
            return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Заполните все поля"})}

        cur.execute(
            "INSERT INTO tasks (student_id, teacher_id, title, description, task_type) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (student_id, teacher_id, title, description, task_type),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {
            "statusCode": 201,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"id": new_id}),
        }

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        task_id = body.get("task_id")
        teacher_comment = body.get("teacher_comment")
        student_answer = body.get("student_answer")
        status = body.get("status")

        if not task_id:
            conn.close()
            return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Укажите task_id"})}

        fields = []
        vals = []
        if teacher_comment is not None:
            fields.append("teacher_comment = %s")
            vals.append(teacher_comment)
        if student_answer is not None:
            fields.append("student_answer = %s")
            vals.append(student_answer)
        if status is not None:
            fields.append("status = %s")
            vals.append(status)
        fields.append("updated_at = NOW()")
        vals.append(task_id)

        cur.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"ok": True}),
        }

    conn.close()
    return {"statusCode": 405, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}