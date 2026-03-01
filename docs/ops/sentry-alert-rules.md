# Sentry Alert Rules

Use separate Sentry projects for backend and frontend. The rules below are the minimum baseline for production.

## 1. Backend 500 Errors
- Project: backend
- Environment: `production`
- Query: `event.type:error http.status_code:500`
- Condition: more than `5` events in `5m`
- Action: notify team channel (Slack/Email) with high urgency

## 2. Frontend Runtime Errors
- Project: frontend
- Environment: `production`
- Query: `event.type:error`
- Condition: more than `20` events in `10m`
- Action: notify team channel with medium urgency

## 3. WebSocket Reconnect Exhausted / Disconnect Spike
- Project: frontend
- Environment: `production`
- Query: `message:"[ws] reconnect_exhausted" OR message:"[ws] heartbeat_timeout" OR message:"[ws] close"`
- Condition: more than `10` events in `5m`
- Action: notify team channel with high urgency

## Recommended Extras
- Add a release filter so alerts are tied to newly deployed versions.
- Add ownership rules so backend/frontend alerts route to correct on-call.
