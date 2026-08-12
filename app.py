from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from models import db, User, Deal, TargetSetting
import os

app = Flask(__name__)
app.config.from_object(Config)

# --- [추가] Render PostgreSQL 클라우드 DB 연동 설정 ---
db_url = os.environ.get('DATABASE_URL')
if db_url and db_url.startswith("postgres://"):
    # SQLAlchemy 최신 버전 호환을 위해 postgres:// 를 postgresql:// 로 변경
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:///database/app.db'
# ---------------------------------------------------

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# DB 초기화 및 기본 설정값 로드
with app.app_context():
    db.create_all()
    if not TargetSetting.query.first():
        default_target = TargetSetting(target_revenue=100000, target_gp=20000)
        db.session.add(default_target)
        db.session.commit()

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        name = request.form.get('name')
        position = request.form.get('position')
        department = request.form.get('department')

        if User.query.filter_by(username=username).first():
            flash('이미 존재하는 아이디입니다.', 'danger')
            return redirect(url_for('signup'))

        hashed_pw = generate_password_hash(password, method='scrypt')
        new_user = User(
            username=username, 
            password=hashed_pw, 
            name=name, 
            position=position, 
            department=department
        )
        db.session.add(new_user)
        db.session.commit()

        flash('회원가입이 완료되었습니다! 로그인 해주세요.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('아이디 또는 비밀번호가 올바르지 않습니다.', 'danger')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/commercial')
@login_required
def commercial():
    return render_template('commercial.html', team_name='커머셜팀')

@app.route('/service')
@login_required
def service():
    return render_template('service.html', team_name='서비스영업팀')

@app.route('/headquarters')
@login_required
def headquarters():
    return render_template('headquarters.html')

# --- API Endpoints ---

@app.route('/api/dashboard-data', methods=['GET'])
@login_required
def get_dashboard_data():
    target = TargetSetting.query.first()
    if not target:
        target = TargetSetting(target_revenue=0, target_gp=0, comm_target_rev=0, comm_target_gp=0, serv_target_rev=0, serv_target_gp=0)
        db.session.add(target)
        db.session.commit()

    deals = Deal.query.all()
    comm_deals = [d for d in deals if d.team == '커머셜팀']
    serv_deals = [d for d in deals if d.team == '서비스영업팀']

    def calc_stats(deal_list, t_rev, t_gp):
        rev = sum(d.revenue for d in deal_list)
        gp = sum(d.gp for d in deal_list)
        rev_pct = round((rev / t_rev * 100), 1) if t_rev > 0 else 0
        gp_pct = round((gp / t_gp * 100), 1) if t_gp > 0 else 0
        return {'count': len(deal_list), 'revenue': rev, 'gp': gp, 'rev_pct': rev_pct, 'gp_pct': gp_pct}

    def calc_100_stats(deal_list, t_rev, t_gp):
        d100 = [d for d in deal_list if d.probability == 100]
        rev = sum(d.revenue for d in d100)
        gp = sum(d.gp for d in d100)
        rev_pct = round((rev / t_rev * 100), 1) if t_rev > 0 else 0
        gp_pct = round((gp / t_gp * 100), 1) if t_gp > 0 else 0
        return {'count': len(d100), 'revenue': rev, 'gp': gp, 'rev_pct': rev_pct, 'gp_pct': gp_pct}

    return jsonify({
        'total': calc_stats(deals, target.target_revenue, target.target_gp),
        'total_100': calc_100_stats(deals, target.target_revenue, target.target_gp),
        'commercial': calc_stats(comm_deals, target.comm_target_rev, target.comm_target_gp),
        'commercial_100': calc_100_stats(comm_deals, target.comm_target_rev, target.comm_target_gp),
        'service': calc_stats(serv_deals, target.serv_target_rev, target.serv_target_gp),
        'service_100': calc_100_stats(serv_deals, target.serv_target_rev, target.serv_target_gp),
        'targets': {
            'total_rev': target.target_revenue,
            'total_gp': target.target_gp,
            'comm_rev': target.comm_target_rev,
            'comm_gp': target.comm_target_gp,
            'serv_rev': target.serv_target_rev,
            'serv_gp': target.serv_target_gp
        }
    })

@app.route('/api/target-setting', methods=['POST'])
@login_required
def save_targets():
    data = request.json
    target = TargetSetting.query.first()
    if not target:
        target = TargetSetting()
        db.session.add(target)
        
    target.target_revenue = data.get('target_revenue', 0)
    target.target_gp = data.get('target_gp', 0)
    target.comm_target_rev = data.get('comm_target_rev', 0)
    target.comm_target_gp = data.get('comm_target_gp', 0)
    target.serv_target_rev = data.get('serv_target_rev', 0)
    target.serv_target_gp = data.get('serv_target_gp', 0)
    
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/deals', methods=['GET'])
@login_required
def get_deals():
    team = request.args.get('team')
    query = Deal.query
    if team:
        query = query.filter_by(team=team)
    deals = query.order_by(Deal.id.desc()).all()
    
    return jsonify([{
        'id': d.id,
        'team': d.team,
        'title': d.title,
        'probability': d.probability,
        'revenue': d.revenue,
        'gp': d.gp,
        'sales_rep': d.sales_rep,
        'closing_month': d.closing_month,
        'memo': d.memo
    } for d in deals])

@app.route('/api/deals', methods=['POST'])
@login_required
def create_deal():
    data = request.json
    deal = Deal(
        team=data['team'],
        title=data['title'],
        probability=int(data['probability']),
        revenue=float(data['revenue']),
        gp=float(data['gp']),
        sales_rep=data['sales_rep'],
        closing_month=data['closing_month'],
        memo=data.get('memo', '')
    )
    db.session.add(deal)
    db.session.commit()
    return jsonify({'status': 'success', 'id': deal.id})

@app.route('/api/deals/<int:deal_id>', methods=['PUT', 'DELETE'])
@login_required
def deal_detail(deal_id):
    deal = Deal.query.get_or_404(deal_id)
    
    if request.method == 'PUT':
        data = request.json
        deal.title = data['title']
        deal.probability = int(data['probability'])
        deal.revenue = float(data['revenue'])
        deal.gp = float(data['gp'])
        deal.sales_rep = data['sales_rep']
        deal.closing_month = data['closing_month']
        deal.memo = data.get('memo', '')
        db.session.commit()
        return jsonify({'status': 'updated'})
        
    elif request.method == 'DELETE':
        db.session.delete(deal)
        db.session.commit()
        return jsonify({'status': 'deleted'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)