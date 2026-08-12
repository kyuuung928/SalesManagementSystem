let selectedDealId = null;
let currentTeam = ""; 
let teamGaugeCharts = {};

function formatNumberInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value ? Number(value).toLocaleString('ko-KR') : '';
}

function parseFormattedNumber(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/,/g, '')) || 0;
}

function initTeamPage(teamName) {
    currentTeam = teamName;
    loadDeals();
    loadTeamGauges();
}

function createTeamGauge(canvasId, percentage) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const ctx = el.getContext('2d');
    if (teamGaugeCharts[canvasId]) teamGaugeCharts[canvasId].destroy();

    teamGaugeCharts[canvasId] = new Chart(ctx, {
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

function loadTeamGauges() {
    fetch('/api/dashboard-data')
        .then(res => res.json())
        .then(data => {
            let tData, t100Data;
            if (currentTeam === '커머셜팀') {
                tData = data.commercial;
                t100Data = data.commercial_100;
            } else if (currentTeam === '서비스영업팀') {
                tData = data.service;
                t100Data = data.service_100;
            } else {
                tData = data.total;
                t100Data = data.total_100;
            }

            createTeamGauge('team-gauge-rev', tData.rev_pct);
            document.getElementById('team-rev-pct-text').innerText = `${tData.rev_pct}%`;

            createTeamGauge('team-gauge-gp', tData.gp_pct);
            document.getElementById('team-gp-pct-text').innerText = `${tData.gp_pct}%`;

            createTeamGauge('team-gauge-rev-100', t100Data.rev_pct);
            document.getElementById('team-rev-100-pct-text').innerText = `${t100Data.rev_pct}%`;

            createTeamGauge('team-gauge-gp-100', t100Data.gp_pct);
            document.getElementById('team-gp-100-pct-text').innerText = `${t100Data.gp_pct}%`;
        });
}

function loadDeals() {
    const url = currentTeam ? `/api/deals?team=${encodeURIComponent(currentTeam)}` : '/api/deals';
    fetch(url)
        .then(res => res.json())
        .then(data => {
            renderTable(data);
            calculateSummary(data);
        });
}

function renderTable(deals) {
    const tbody = document.getElementById('deal-table-body');
    tbody.innerHTML = '';

    deals.forEach((deal, idx) => {
        const tr = document.createElement('tr');
        tr.onclick = () => selectRow(tr, deal);
        
        let rowHTML = `
            <td>${idx + 1}</td>
            ${!currentTeam ? `<td>${deal.team}</td>` : ''}
            <td>${deal.title}</td>
            <td>${deal.probability}%</td>
            <td>${deal.revenue.toLocaleString()}</td>
            <td>${deal.gp.toLocaleString()}</td>
            <td>${deal.sales_rep}</td>
            <td>${deal.closing_month}</td>
        `;
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

function selectRow(tr, deal) {
    document.querySelectorAll('#deal-table-body tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
    selectedDealId = deal.id;
    
    document.getElementById('deal-id').value = deal.id;
    document.getElementById('deal-title').value = deal.title;
    document.getElementById('deal-prob').value = deal.probability;
    document.getElementById('deal-rev').value = Number(deal.revenue).toLocaleString('ko-KR');
    document.getElementById('deal-gp').value = Number(deal.gp).toLocaleString('ko-KR');
    document.getElementById('deal-rep').value = deal.sales_rep;
    document.getElementById('deal-month').value = deal.closing_month;
    document.getElementById('deal-memo').value = deal.memo || '';
}

function calculateSummary(deals) {
    const count = deals.length;
    const revSum = deals.reduce((acc, d) => acc + d.revenue, 0);
    const gpSum = deals.reduce((acc, d) => acc + d.gp, 0);

    document.getElementById('sum-count').innerText = `${count} 건`;
    document.getElementById('sum-revenue').innerText = `${revSum.toLocaleString()} 원`;
    document.getElementById('sum-gp').innerText = `${gpSum.toLocaleString()} 원`;
}

function searchDeals() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const url = currentTeam ? `/api/deals?team=${encodeURIComponent(currentTeam)}` : '/api/deals';
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const filtered = data.filter(d => 
                d.title.toLowerCase().includes(query) || 
                d.sales_rep.toLowerCase().includes(query)
            );
            renderTable(filtered);
            calculateSummary(filtered);
        });
}

function openAddModal() {
    selectedDealId = null;
    document.getElementById('deal-form').reset();
    document.getElementById('deal-id').value = '';
    document.getElementById('modal-title').innerText = '신규 사업 등록';
    document.getElementById('deal-modal').style.display = 'flex';
}

function openEditModal() {
    if (!selectedDealId) {
        alert('수정할 항목을 테이블에서 클릭해 선택해주세요.');
        return;
    }
    document.getElementById('modal-title').innerText = '사업 정보 수정';
    document.getElementById('deal-modal').style.display = 'flex';
}

function closeDealModal() {
    document.getElementById('deal-modal').style.display = 'none';
}

function saveDeal() {
    const id = document.getElementById('deal-id').value;
    const revValue = parseFormattedNumber(document.getElementById('deal-rev').value);
    const gpValue = parseFormattedNumber(document.getElementById('deal-gp').value);

    const payload = {
        team: currentTeam,
        title: document.getElementById('deal-title').value,
        probability: document.getElementById('deal-prob').value,
        revenue: revValue,
        gp: gpValue,
        sales_rep: document.getElementById('deal-rep').value,
        closing_month: document.getElementById('deal-month').value,
        memo: document.getElementById('deal-memo').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/deals/${id}` : '/api/deals';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
        closeDealModal();
        loadDeals();
        loadTeamGauges();
    });
}

function deleteDeal() {
    if (!selectedDealId) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }
    if (confirm('삭제하시겠습니까?')) {
        fetch(`/api/deals/${selectedDealId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                selectedDealId = null;
                loadDeals();
                loadTeamGauges();
            });
    }
}