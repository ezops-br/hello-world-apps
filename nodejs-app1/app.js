const express = require("express");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const app = express();

const sqs = new SQSClient({ region: "us-east-1" });
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/975635808270/hello-world-apps.fifo";

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Node.js Form</title>
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
      <form id="messageForm">
        <div class="form-group">
          <label>Name:</label>
          <input type="text" id="name" required>
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label>Message:</label>
          <input type="text" id="message" required>
        </div>
        <button type="submit">Send to Queue</button>
      </form>
      <div id="result"></div>

      <script>
        document.getElementById("messageForm").addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value
          };

          try {
            const response = await fetch("/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
            });
            const result = await response.json();
            document.getElementById("result").innerHTML = `Message sent! MessageId: ${result.MessageId}`;
          } catch (error) {
            document.getElementById("result").innerHTML = "Error sending message";
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.post("/send", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({ name, email, message }),
      MessageGroupId: "messageGroup1",
      MessageDeduplicationId: Date.now().toString()
    };

    const command = new SendMessageCommand(params);
    const response = await sqs.send(command);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.listen(3000, () => console.log("App 1 running on port 3000"));
