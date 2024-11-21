const express = require("express");
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const app = express();

const sqs = new SQSClient({ region: "us-east-1" });
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/975635808270/hello-world-apps.fifo";

app.get("/", (req, res) => {
  res.send(`
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
              return \`
                <div class="message">
                  <p><strong>Name:</strong> \${body.name}</p>
                  <p><strong>Email:</strong> \${body.email}</p>
                  <p><strong>Message:</strong> \${body.message}</p>
                  <p><strong>Sent at:</strong> \${new Date(parseInt(msg.Attributes.SentTimestamp)).toLocaleString()}</p>
                </div>
              \`;
            }).join("");
          } catch (error) {
            document.getElementById("messages").innerHTML = "Error loading messages";
          }
        }

        fetchMessages();
      </script>
    </body>
    </html>
  `);
});

app.get("/messages", async (req, res) => {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      AttributeNames: ["All"],
      MessageAttributeNames: ["All"],
      WaitTimeSeconds: 1
    });

    const response = await sqs.send(command);
    const messages = response.Messages || [];

    // Delete received messages from queue
    await Promise.all(messages.map(msg => {
      const deleteCommand = new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: msg.ReceiptHandle
      });
      return sqs.send(deleteCommand);
    }));

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.listen(3000, () => console.log("App 2 running on port 3000"));
