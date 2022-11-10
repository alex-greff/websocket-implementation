# Note: make sure this is run at the root of the project
FROM python:3.8-alpine
WORKDIR /app
RUN mkdir -p ./dist
COPY ./websocket-server ./dist
COPY ./testing-app/server .
CMD ["python3", "chat_server.py"]