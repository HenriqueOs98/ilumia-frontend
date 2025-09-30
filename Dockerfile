# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy all application files
COPY . .

# Expose port 8000
EXPOSE 8000

# Run the Python HTTP server
CMD ["python3", "server.py"]
