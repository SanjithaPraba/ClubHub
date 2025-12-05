# Use a lightweight Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app code
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Run the app using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]