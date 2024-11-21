from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
import boto3
import json
import time

app = FastAPI()

sqs = boto3.client("sqs", region_name="us-east-1", aws_access_key_id="", aws_secret_access_key="")
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/975635808270/hello-world-apps.fifo"

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Python Form</title>
        <style>
            body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input { width: 100%; padding: 8px; }
            button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Send Message to Queue</h1>
        <form id="messageForm" method="POST" action="/send">
            <div class="form-group">
                <label>Name:</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Message:</label>
                <input type="text" name="message" required>
            </div>
            <button type="submit">Send to Queue</button>
        </form>
        <div id="result"></div>
    </body>
    </html>
    """

@app.post("/send")
async def send_message(request: Request):
    form_data = await request.form()
    message_body = {
        "name": form_data["name"],
        "email": form_data["email"],
        "message": form_data["message"]
    }
    
    try:
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(message_body),
            MessageGroupId="messageGroup1",
            MessageDeduplicationId=str(int(time.time() * 1000))
        )
        return {"message": "Message sent successfully", "MessageId": response["MessageId"]}
    except Exception as e:
        return {"error": str(e)}
