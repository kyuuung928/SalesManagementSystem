import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_DIR = os.path.join(BASE_DIR, 'database')

if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

class Config:
    SECRET_KEY = 'sales-management-system-secret-key-navy-theme'
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(DB_DIR, 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False