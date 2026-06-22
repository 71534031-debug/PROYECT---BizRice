FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    unixodbc \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements ./requirements

RUN pip install --no-cache-dir -r requirements

COPY . .

EXPOSE 10000

CMD ["uvicorn","main:app","--host","0.0.0.0","--port","10000"]