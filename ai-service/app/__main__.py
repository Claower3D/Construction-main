"""Entry point for: python -m app.bot"""
import os
import sys

# Load .env
from dotenv import load_dotenv
load_dotenv()

from app.bot import main
main()
