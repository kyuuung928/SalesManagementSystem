let gaugeCharts = {};

function formatNumberInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value ? Number(value).toLocaleString('ko-KR') : '';
}

function parseFormattedNumber(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/,/g, '')) || 0;
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

function createGaugeChart(canvasId, percentage) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const ctx = el.getContext('2d');
    
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
            plugins: { tooltip: { enabled: false }, legend: { display: false } }
        }
    });
}

function renderGaugePair(revId, gpId, revTxtId, gpTxtId, dataObj) {
    createGaugeChart(revId, dataObj.rev_pct);
    const revText = document.getElementById(revTxtId);
    if (revText) revText.innerText = `${dataObj.rev_pct}%`;

    createGaugeChart(gpId, dataObj.gp_pct);
    const gpText = document.getElementById(gpTxtId);
    if (gpText) gpText.innerText = `${dataObj.gp_pct}%`;
}

function loadDashboardData() {
    fetch('/api/dashboard-data')
        .then(res => res.json())
        .then(data => {
            // 본부 전체 차트
            renderGaugePair('gauge-rev', 'gauge-gp', 'rev-pct-text', 'gp-pct-text', data.total);
            renderGaugePair('gauge-rev-100', 'gauge-gp-100', 'rev-100-pct-text', 'gp-100-pct-text', data.total_100);

            // 커머셜팀 차트
            renderGaugePair('comm-gauge-rev', 'comm-gauge-gp', 'comm-rev-pct-text', 'comm-gp-pct-text', data.commercial);
            renderGaugePair('comm-gauge-rev-100', 'comm-gauge-gp-100', 'comm-rev-100-pct-text', 'comm-gp-100-pct-text', data.commercial_100);

            // 서비스영업팀 차트
            renderGaugePair('serv-gauge-rev', 'serv-gauge-gp', 'serv-rev-pct-text', 'serv-gp-pct-text', data.service);
            renderGaugePair('serv-gauge-rev-100', 'serv-gauge-gp-100', 'serv-rev-100-pct-text', 'serv-gp-100-pct-text', data.service_100);

            // 총 수치 카드
            document.getElementById('total-count').innerText = `${data.total.count} 건`;
            document.getElementById('total-revenue').innerText = `${data.total.revenue.toLocaleString()} 원`;
            document.getElementById('total-gp').innerText = `${data.total.gp.toLocaleString()} 원`;

            // 팀별 표 수치
            document.getElementById('comm-count').innerText = `${data.commercial.count} 건`;
            document.getElementById('comm-revenue').innerText = `${data.commercial.revenue.toLocaleString()} 원`;
            document.getElementById('comm-gp').innerText = `${data.commercial.gp.toLocaleString()} 원`;

            document.getElementById('serv-count').innerText = `${data.service.count} 건`;
            document.getElementById('serv-revenue').innerText = `${data.service.revenue.toLocaleString()} 원`;
            document.getElementById('serv-gp').innerText = `${data.service.gp.toLocaleString()} 원`;

            // 설정 모달 인풋 기본값 세팅
            const tg = data.targets;
            document.getElementById('target-rev-input').value = Number(tg.total_rev).toLocaleString('ko-KR');
            document.getElementById('target-gp-input').value = Number(tg.total_gp).toLocaleString('ko-KR');
            document.getElementById('comm-target-rev-input').value = Number(tg.comm_rev).toLocaleString('ko-KR');
            document.getElementById('comm-target-gp-input').value = Number(tg.comm_gp).toLocaleString('ko-KR');
            document.getElementById('serv-target-rev-input').value = Number(tg.serv_rev).toLocaleString('ko-KR');
            document.getElementById('serv-target-gp-input').value = Number(tg.serv_gp).toLocaleString('ko-KR');
        });
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
    const payload = {
        target_revenue: parseFormattedNumber(document.getElementById('target-rev-input').value),
        target_gp: parseFormattedNumber(document.getElementById('target-gp-input').value),
        comm_target_rev: parseFormattedNumber(document.getElementById('comm-target-rev-input').value),
        comm_target_gp: parseFormattedNumber(document.getElementById('comm-target-gp-input').value),
        serv_target_rev: parseFormattedNumber(document.getElementById('serv-target-rev-input').value),
        serv_target_gp: parseFormattedNumber(document.getElementById('serv-target-gp-input').value)
    };

    fetch('/api/target-setting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
        closeSettingsModal();
        loadDashboardData();
    });
}