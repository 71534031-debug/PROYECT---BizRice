FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y curl gnupg unixodbc unixodbc-dev

RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -

RUN curl https://packages.microsoft.com/config/debian/12/prod.list \
> /etc/apt/sources.list.d/mssql-release.list

RUN apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 10000

CMD ["uvicorn","main:app","--host","0.0.0.0","--port","10000"]