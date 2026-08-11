let selectedDealId = null;
let currentTeam = ""; 

// --- [추가] 3자리 쉼표 포맷팅 유틸리티 함수 ---
function formatNumberInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
        input.value = Number(value).toLocaleString('ko-KR');
    } else {
        input.value = '';
    }
}

function parseFormattedNumber(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/,/g, '')) || 0;
}
// ----------------------------------------------

function initTeamPage(teamName) {
    currentTeam = teamName;
    loadDeals();
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
    
    // 모달에 정보 세팅 (숫자를 천단위 쉼표 포맷으로 변환하여 표시)
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
    
    // 쉼표 제거 후 숫자값 추출
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
            });
    }
}