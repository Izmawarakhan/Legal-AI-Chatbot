COMPLETE STEP-BY-STEP GUIDE
Step 1: Start Your Backend (Python/FastAPI)
Open Terminal/PowerShell #1:

bash
# Navigate to your backend folder
cd D:\FYP\backend  # or wherever your Api.py is

# Start the FastAPI server
uvicorn Api:app --reload --port 8000
Wait for this message:

text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
✅ Keep this terminal open!

Step 2: Start Your Frontend (React)
Open Terminal/PowerShell #2:

bash
# Navigate to your frontend folder
cd D:\FYP\frontend  # or wherever your package.json is

# Start the React development server
npm start
Wait for this message:

text
VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
✅ Keep this terminal open!

Step 3: Install ngrok (If Not Already)
Open Terminal/PowerShell #3:

bash
# Check if ngrok is installed
ngrok --version
If not installed:

Go to https://ngrok.com/download

Download the Windows version (ngrok-v3-stable-windows-amd64.zip)

Extract to C:\ngrok\

Add to PATH or navigate to that folder

Step 4: Authenticate ngrok with Your Token
In Terminal #3:

bash
# Navigate to ngrok folder
cd C:\ngrok

# Add your authtoken (get from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken YOUR_TOKEN_HERE

# Example:
# ngrok config add-authtoken 1a2b3c4d5e6f7g8h9i0j
You should see:

text
Authtoken saved to configuration file: C:\Users\YourName\AppData\Local\ngrok\ngrok.yml
Step 5: Expose Your Backend with ngrok
In Terminal #3 (still in C:\ngrok):

bash
# Expose port 8000 (your FastAPI backend)
ngrok http 8000
You'll see this screen:

text
ngrok by @inconshreveable

Session Status                online
Account                       YourName (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000
Forwarding                    http://abc123.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
COPY the HTTPS URL (e.g., https://abc123.ngrok-free.app) — you'll need this!

✅ Keep this terminal open!

Step 6: Expose Your Frontend with ngrok
Open Terminal/PowerShell #4:

bash
# Navigate to ngrok folder
cd C:\ngrok

# Expose port 5173 (your React frontend)
ngrok http 5173
You'll see:

text
Forwarding                    https://xyz789.ngrok-free.app -> http://localhost:5173
Forwarding                    http://xyz789.ngrok-free.app -> http://localhost:5173
COPY this HTTPS URL (e.g., https://xyz789.ngrok-free.app)

✅ Keep this terminal open!

Step 7: Update Your Frontend API_BASE
Now you have two URLs:

Backend: https://abc123.ngrok-free.app

Frontend: https://xyz789.ngrok-free.app

Open your app.jsx file:
Location: D:\FYP\frontend\src\app.jsx (or similar)

Find this line at the top:

javascript
const API_BASE = "http://localhost:8000";
Replace it with your backend ngrok URL:

javascript
const API_BASE = "https://abc123.ngrok-free.app";
Save the file!

Step 8: Restart Your Frontend
Go back to Terminal #2 (where npm start is running):

Press Ctrl + C to stop

Start again:

bash
npm start
Wait for it to say Local: http://localhost:5173/

Step 9: Test Your App!
Open your browser and go to your frontend ngrok URL:

text
https://xyz789.ngrok-free.app
Send a test message — type: "What are my rights in divorce?"

Check the response — it should work!

Step 10: Test from Outside
Share your frontend URL with someone or test on your phone:

text
https://xyz789.ngrok-free.app
They should see your chatbot and be able to interact with it!

Step 11: Check Your Backend Logs
Look at Terminal #1 (uvicorn) — you should see:

text
INFO:     127.0.0.1:xxxxx - "POST /api/chat HTTP/1.1" 200 OK
INFO:     127.0.0.1:xxxxx - "GET /api/chat/sessions HTTP/1.1" 200 OK
Look at Terminal #3 (ngrok backend) — you should see:

text
GET /api/chat/sessions      200 OK
POST /api/chat              200 OK
Troubleshooting Quick Fixes
❌ "CORS error" in browser console
Solution: Your FastAPI CORS is already set to allow all origins (allow_origins=["*"]), so this should work. If not, restart your backend.

❌ "Connection refused" or "Failed to fetch"
Solution: Make sure your backend ngrok URL is correct in API_BASE and that the backend is running.

❌ "Invalid session" or session errors
Solution: Your frontend is using the public URL but trying to access local MongoDB. MongoDB should still work since it's local to your backend.

❌ "Cannot find module" errors
Solution: Make sure all dependencies are installed:

bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
Visual Summary of All Terminals
text
┌─────────────────────────────────────────────────────────────┐
│ TERMINAL 1: Backend (uvicorn)                              │
│ C:\> cd D:\FYP\backend                                     │
│ D:\FYP\backend> uvicorn Api:app --reload --port 8000      │
│ ✅ Running on http://127.0.0.1:8000                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TERMINAL 2: Frontend (npm)                                 │
│ C:\> cd D:\FYP\frontend                                    │
│ D:\FYP\frontend> npm start                                 │
│ ✅ Running on http://localhost:5173                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TERMINAL 3: ngrok Backend                                  │
│ C:\ngrok> ngrok http 8000                                  │
│ ✅ Forwarding: https://abc123.ngrok-free.app -> 8000      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TERMINAL 4: ngrok Frontend                                 │
│ C:\ngrok> ngrok http 5173                                  │
│ ✅ Forwarding: https://xyz789.ngrok-free.app -> 5173      │
└─────────────────────────────────────────────────────────────┘
Quick Copy-Paste Commands
Windows (PowerShell/CMD):
bash
# Terminal 1 - Backend
cd D:\FYP\backend && uvicorn Api:app --reload --port 8000

# Terminal 2 - Frontend
cd D:\FYP\frontend && npm start

# Terminal 3 - ngrok Backend
cd C:\ngrok && ngrok http 8000

# Terminal 4 - ngrok Frontend
cd C:\ngrok && ngrok http 5173
Mac/Linux:
bash
# Terminal 1 - Backend
cd ~/Projects/backend && uvicorn Api:app --reload --port 8000

# Terminal 2 - Frontend
cd ~/Projects/frontend && npm start

# Terminal 3 - ngrok Backend
ngrok http 8000

# Terminal 4 - ngrok Frontend
ngrok http 5173
One-Liner to See All Your URLs
After all services are running, check:

Backend ngrok: Look at Terminal 3 → Forwarding https://...

Frontend ngrok: Look at Terminal 4 → Forwarding https://...

Local backend: http://localhost:8000/docs (Swagger UI)

Local frontend: http://localhost:5173

Final Verification Checklist
Backend running on localhost:8000

Frontend running on localhost:5173

ngrok authenticated with token

Backend exposed via ngrok (Terminal 3)

Frontend exposed via ngrok (Terminal 4)

API_BASE updated with backend ngrok URL

Frontend restarted after API_BASE change

Tested with a message on the ngrok frontend URL

Shared URL works on phone/other device

That's it! Your full chatbot is now live at https://xyz789.ngrok-free.app and accessible from anywhere in the world! 🚀

Let me know if any step fails and I'll help you debug!