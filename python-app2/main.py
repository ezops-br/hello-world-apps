from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import boto3
import json

app = FastAPI()

sqs = boto3.client("sqs", region_name="us-east-1")
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/975635808270/hello-world-apps.fifo"

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Queue Messages</title>
        <style>
            body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
            .message { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
            .refresh { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-bottom: 20px; }
            .no-messages { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>Messages from Queue</h1>
        <button class="refresh" onclick="location.reload()">Refresh Messages</button>
        <div id="messages">Loading messages...</div>
        <script>
            async function fetchMessages() {
                try {
                    const response = await fetch("/messages");
                    const data = await response.json();
                    const messagesDiv = document.getElementById("messages");
                    
                    if (data.length === 0) {
                        messagesDiv.innerHTML = "<p class='no-messages'>No messages in queue</p>";
                        return;
                    }

                    messagesDiv.innerHTML = data.map(msg => {
                        const body = JSON.parse(msg.Body);
                        return `
                            <div class="message">
                                <p><strong>Name:</strong> \${body.name}</p>
                                <p><strong>Email:</strong> \${body.email}</p>
                                <p><strong>Message:</strong> \${body.message}</p>
                                <p><strong>Sent at:</strong> \${new Date(parseInt(msg.Attributes.SentTimestamp)).toLocaleString()}</p>
                            </div>
                        `;
                    }).join("");
                } catch (error) {
                    document.getElementById("messages").innerHTML = "Error loading messages";
                }
            }
            fetchMessages();
        </script>
    </body>
    </html>
    """
    return html_content

@app.get("/messages")
async def get_messages():
    try:
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=10,
            AttributeNames=["All"],
            MessageAttributeNames=["All"],
            WaitTimeSeconds=1
        )
        
        messages = response.get("Messages", [])
        
        for msg in messages:
            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=msg["ReceiptHandle"]
            )
            
        return messages
    except Exception as e:
        return {"error": str(e)}
