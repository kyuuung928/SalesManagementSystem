let gaugeCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

function createGaugeChart(canvasId, title, percentage) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (gaugeCharts[canvasId]) {
        gaugeCharts[canvasId].destroy();
    }

    gaugeCharts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, Math.max(0, 100 - percentage)],
                backgroundColor: [
                    percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
                    '#334155'
                ],
                borderWidth: 0
            }]
        },
        options: {
            rotation: -90,
            circumference: 180,
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        }
    });
}

function loadDashboardData() {
    fetch('/api/dashboard-data')
        .then(res => res.json())
        .then(data => {
            // 차트 렌더링
            createGaugeChart('gauge-rev', '목표대비 매출', data.total.rev_pct);
            document.getElementById('rev-pct-text').innerText = `${data.total.rev_pct}%`;

            createGaugeChart('gauge-gp', '목표대비 GP', data.total.gp_pct);
            document.getElementById('gp-pct-text').innerText = `${data.total.gp_pct}%`;

            createGaugeChart('gauge-rev-100', '100% 목표대비 매출', data.total_100.rev_pct);
            document.getElementById('rev-100-pct-text').innerText = `${data.total_100.rev_pct}%`;

            createGaugeChart('gauge-gp-100', '100% 목표대비 GP', data.total_100.gp_pct);
            document.getElementById('gp-100-pct-text').innerText = `${data.total_100.gp_pct}%`;

            // 총 수치 표현
            document.getElementById('total-count').innerText = `${data.total.count} 건`;
            document.getElementById('total-revenue').innerText = `${data.total.revenue.toLocaleString()} 원`;
            document.getElementById('total-gp').innerText = `${data.total.gp.toLocaleString()} 원`;

            // 팀별 수치
            document.getElementById('comm-count').innerText = `${data.commercial.count} 건`;
            document.getElementById('comm-revenue').innerText = `${data.commercial.revenue.toLocaleString()} 원`;
            document.getElementById('comm-gp').innerText = `${data.commercial.gp.toLocaleString()} 원`;

            document.getElementById('serv-count').innerText = `${data.service.count} 건`;
            document.getElementById('serv-revenue').innerText = `${data.service.revenue.toLocaleString()} 원`;
            document.getElementById('serv-gp').innerText = `${data.service.gp.toLocaleString()} 원`;

            // 설정 모달 초기값
            document.getElementById('target-rev-input').value = data.target_revenue;
            document.getElementById('target-gp-input').value = data.target_gp;
        });
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
    const rev = document.getElementById('target-rev-input').value;
    const gp = document.getElementById('target-gp-input').value;

    fetch('/api/target-setting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_revenue: rev, target_gp: gp })
    })
    .then(res => res.json())
    .then(() => {
        closeSettingsModal();
        loadDashboardData();
    });
}