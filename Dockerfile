FROM node:20-slim

# Create non-root user (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PORT=7860

WORKDIR $HOME/app

# Copy dependency configs
COPY --chown=user package*.json ./
RUN npm install

# Copy application files
COPY --chown=user . .

EXPOSE 7860

CMD ["node", "bot.js"]
