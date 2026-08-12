from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False) # 아이디
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(50), nullable=False)                 # 이름
    position = db.Column(db.String(20), nullable=False)             # 직급
    department = db.Column(db.String(50), nullable=False)           # 부서

class Deal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team = db.Column(db.String(50), nullable=False)        # 커머셜팀 또는 서비스영업팀
    title = db.Column(db.String(200), nullable=False)       # 사업명
    probability = db.Column(db.Integer, nullable=False)    # 수주확률 (0, 25, 50, 75, 100)
    revenue = db.Column(db.Float, default=0.0)             # 매출
    gp = db.Column(db.Float, default=0.0)                  # GP
    sales_rep = db.Column(db.String(50), nullable=False)   # 영업대표
    closing_month = db.Column(db.String(20), nullable=False)# 수주시기 (YYYY-MM)
    memo = db.Column(db.Text, nullable=True)               # 메모
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# models.py 또는 app.py 내 TargetSetting 모델 부분
class TargetSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target_revenue = db.Column(db.Float, default=0.0)
    target_gp = db.Column(db.Float, default=0.0)
    comm_target_rev = db.Column(db.Float, default=0.0)
    comm_target_gp = db.Column(db.Float, default=0.0)
    serv_target_rev = db.Column(db.Float, default=0.0)
    serv_target_gp = db.Column(db.Float, default=0.0)