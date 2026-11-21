document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storage = {
    get(key, fallback = '', area = 'localStorage') { try { return JSON.parse(window[area].getItem(`ph-${key}`)) ?? fallback; } catch { return fallback; } },
    set(key, value, area = 'localStorage') { try { window[area].setItem(`ph-${key}`, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ } }
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => Number(value).toLocaleString('ko-KR');
  const params = new URLSearchParams(location.search);
  const loginLink = $('header .login a');
  const benefits = $('.benefits');
  let demoSignedIn = storage.get('demo-signed-in', false, 'sessionStorage') === true;
  function renderDemoLogin() {
    loginLink.textContent = demoSignedIn ? '로그아웃' : '로그인';
    if (!benefits) return;

    $$('[data-benefit-welcome]', benefits).forEach(item => { item.hidden = !demoSignedIn; });
    $$('[data-benefit-guest]', benefits).forEach(item => { item.hidden = demoSignedIn; });
    $$('.benefit-links a', benefits).forEach(link => {
      if (demoSignedIn) {
        link.removeAttribute('href');
        link.setAttribute('role', 'link');
        link.setAttribute('aria-disabled', 'true');
      } else {
        link.setAttribute('href', 'login.html');
        link.removeAttribute('role');
        link.removeAttribute('aria-disabled');
      }
    });
  }
  renderDemoLogin();
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      demoSignedIn = storage.get('demo-signed-in', demoSignedIn, 'sessionStorage') === true;
      renderDemoLogin();
    }
  });
  loginLink.addEventListener('click', () => {
    if (demoSignedIn) {
      demoSignedIn = false;
      storage.set('demo-signed-in', false, 'sessionStorage');
      renderDemoLogin();
    }
  });
  let orderType = params.get('order') === 'takeout' ? 'takeout' : params.get('order') === 'delivery' ? 'delivery' : storage.get('order', 'delivery');
  storage.set('order', orderType);
  let address = storage.get('address');
  let cart = storage.get('cart', []);
  if (!Array.isArray(cart)) cart = [];
  const dialog = document.createElement('dialog');
  dialog.className = 'experience-dialog';
  dialog.setAttribute('aria-labelledby', 'experience-title');
  document.body.append(dialog);
  let returnFocus;
  function openDialog(title, content, options = {}) {
    returnFocus = document.activeElement;
    dialog.classList.remove('food-details-dialog');
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="닫기">×</button>${options.showBrand === false ? '' : '<span class="eyebrow">PIZZA HUT</span>'}<h2 id="experience-title">${title}</h2>${content}`;
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => returnFocus?.focus());
  const addressToast = document.createElement('div');
  addressToast.className = 'address-toast';
  addressToast.setAttribute('role', 'status');
  document.body.append(addressToast);
  let addressToastTimer;

  function updateAddress() { $$('[data-address-copy]').forEach(el => el.textContent = address || '주소를 설정해 주세요'); }
  function locationDialog(type) {
    openDialog(type === 'takeout' ? '어느 동네에서 주문할까요?' : '피자를 받을 곳을 알려주세요.', `<p>주소를 저장하면 다음에도 편하게 이용할 수 있어요.<br />현재는 화면 체험용으로, 실제 매장 검색은 연결 전입니다.</p><form id="address-form"><label for="order-address">도로명 주소 또는 동네</label><input id="order-address" name="address" autocomplete="street-address" placeholder="예: 서울시 영등포구 여의도동" required minlength="2" maxlength="120" value="${escapeHTML(address)}" /><button class="btn btn-red" type="submit">이 주소로 설정</button></form>`, { showBrand: false });
    $('#address-form', dialog).addEventListener('submit', event => {
      event.preventDefault();
      const enteredAddress = $('#order-address', dialog).value.trim();
      if (enteredAddress.length < 2) return;
      address = enteredAddress;
      storage.set('address', address);
      updateAddress();
      dialog.close();

      clearTimeout(addressToastTimer);
      addressToast.textContent = '현재 준비중입니다.';
      addressToastTimer = setTimeout(() => { addressToast.textContent = ''; }, 3000);
    });
  }
  updateAddress();
  $$('[data-location]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); locationDialog(button.dataset.location); }));
  $$('a[href*="order="]').forEach(link => link.addEventListener('click', () => storage.set('order', new URL(link.href).searchParams.get('order'))));
  if (document.body.matches('.home,.menu-list')) {
    const mobile = document.createElement('nav'); mobile.className = 'mobile-order'; mobile.setAttribute('aria-label','빠른 주문'); mobile.innerHTML = '<a href="sub01.html?order=delivery">배달 주문 ↗</a><a href="sub01.html?order=takeout">포장 주문 ↗</a>'; document.body.append(mobile);
  }
  const banner = $('.campaign');
  const slides = $$('.campaign-slide');
  if (banner && slides.length) {
    let slide = 0;
    let timer;
    let transition = 0;
    let paused = false;
    let hovered = false;
    let focused = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const toggle = $('[data-carousel-toggle]', banner);
    function renderSlide(next, animate = true, manual = false) {
      const previous = slides[slide];
      slide = (next + slides.length) % slides.length;
      const incoming = slides[slide];
      const token = ++transition;
      slides.forEach((item, index) => {
        item.getAnimations().forEach(animation => animation.cancel());
        item.hidden = item !== incoming && item !== previous;
        item.classList.toggle('is-active', index === slide);
        item.inert = index !== slide;
        item.setAttribute('aria-hidden', String(index !== slide));
        item.setAttribute('role', 'group');
        item.setAttribute('aria-roledescription', '슬라이드');
        item.setAttribute('aria-label', `${index + 1} / ${slides.length}`);
      });
      const number = $('.slide-number', banner);
      number.setAttribute('aria-live', manual ? 'polite' : 'off');
      number.innerHTML = `${String(slide + 1).padStart(2, '0')} <span>/ ${String(slides.length).padStart(2, '0')}</span>`;
      if (!animate || previous === incoming || reducedMotion.matches) {
        slides.forEach(item => item.hidden = item !== incoming);
        return;
      }
      const timing = { duration: 450, easing: 'ease-out' };
      const outgoingAnimation = previous.animate([{ opacity: 1 }, { opacity: 0 }], timing);
      const incomingAnimation = incoming.animate([{ opacity: 0 }, { opacity: 1 }], timing);
      Promise.all([outgoingAnimation.finished, incomingAnimation.finished]).then(() => {
        if (token === transition) slides.forEach(item => item.hidden = item !== incoming);
      }).catch(() => { /* A newer transition takes over on rapid manual clicks. */ });
    }
    function schedule() {
      clearTimeout(timer);
      if (paused || hovered || focused || document.hidden || slides.length < 2) return;
      timer = setTimeout(() => { renderSlide(slide + 1); schedule(); }, 3000);
    }
    $$('[data-slide]', banner).forEach(button => button.addEventListener('click', () => {
      renderSlide(slide + Number(button.dataset.slide), true, true);
      schedule();
    }));
    toggle?.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '배너 자동 전환 재생' : '배너 자동 전환 일시정지');
      $('span', toggle).textContent = paused ? '▶' : 'Ⅱ';
      schedule();
    });
    banner.addEventListener('pointerenter', event => { if(event.pointerType === 'mouse') { hovered = true; schedule(); } });
    banner.addEventListener('pointerleave', event => { if(event.pointerType === 'mouse') { hovered = false; schedule(); } });
    banner.addEventListener('focusin', () => { focused = Boolean(document.activeElement.closest('.campaign-slide')); schedule(); });
    banner.addEventListener('focusout', event => { focused = Boolean(event.relatedTarget?.closest?.('.campaign-slide')); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    renderSlide(0, false);
    schedule();
  }
  $$('.search form').forEach(form => {
    const input = $('input', form); input.name = 'q'; form.action = 'sub01.html'; form.method = 'get'; $('button',form).type = 'submit';
    form.addEventListener('submit', event => { if (!input.value.trim()) { event.preventDefault(); input.focus(); } });
  });
  const promotions = [
    ['평일엔 반값, 주말엔 1+1','img5.png','원본 디자인에 포함된 프로모션입니다. 적용 매장, 행사 기간과 중복 할인 조건은 실제 주문 전 공식 피자헛에서 확인해 주세요.'],
    ['인기 피자 할인 이벤트','img6.png','2026년 2월 25일부터 3월 4일까지 진행된 프로모션입니다. 현재 종료된 행사입니다.'],
    ['신메뉴 출시 기념 이벤트','img7.png','2026년 2월 25일부터 3월 25일까지 진행된 프로모션입니다. 현재 종료된 행사입니다.']
  ];
  $$('[data-promotion]').forEach(button => button.addEventListener('click', () => { const [title,img,copy] = promotions[Number(button.dataset.promotion)]; openDialog(title, `<p>${copy}</p><img src="img/figma/${img}" alt="${title}" /><p><a class="text-link" href="sub01.html">피자 메뉴 둘러보기 ↗</a></p>`); }));
  $$('[data-business]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); const group = button.dataset.business === 'group'; openDialog(group ? '함께하는 순간, 단체주문' : '피자헛 가맹 안내', `<p>${group ? '회의, 모임, 축하하는 날. 인원과 수령 일정을 정한 뒤 대표번호로 단체주문 가능 여부를 확인해 주세요.' : '가맹 상담과 개설 조건은 대표번호 또는 피자헛 공식 홈페이지를 통해 확인하실 수 있습니다.'}</p><a class="btn btn-red" href="tel:15885588">1588-5588 전화 문의</a>`); }));
  function updateCart() { $$('.cart-count').forEach(el => el.textContent = cart.reduce((sum,item) => sum + item.quantity, 0)); storage.set('cart', cart); }
  function cartOptionsMarkup(item) {
    const toppings = Array.isArray(item.toppings) ? item.toppings : [];
    const sides = Array.isArray(item.sides) ? item.sides : [];
    const lines = [];
    if(toppings.length) lines.push(`추가 토핑: ${toppings.map(topping => escapeHTML(topping.name)).join(', ')} · 피자 ${item.quantity}판에 적용`);
    if(sides.length) lines.push(`사이드: ${sides.map(side => `${escapeHTML(side.name)} ${Number(side.quantity)}개`).join(', ')}`);
    return lines.length ? `<p class="cart-options">${lines.join('<br />')}</p>` : '';
  }
  function showCart() {
    openDialog('나의 장바구니', cart.length ? `${cart.map((item,i) => `<div class="cart-item"><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.size)} · ${escapeHTML(item.edge)} · ${item.quantity}개<br />${money(item.total)}원</p>${cartOptionsMarkup(item)}<button type="button" data-remove="${i}"><svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7M14 10v7"/></svg><span>삭제</span></button></div>`).join('')}<p><strong>합계 ${money(cart.reduce((sum,item) => sum + item.total, 0))}원</strong></p><p>이 장바구니는 브라우저에 저장되는 화면 체험용입니다. 실제 주문과 결제는 연결되어 있지 않습니다.</p><a class="btn btn-red" href="sub01.html">메뉴 더 둘러보기</a>` : '<p>아직 담은 피자가 없어요.<br />오늘의 취향에 맞는 피자를 찾아보세요.</p><a class="btn btn-red" href="sub01.html">메뉴 둘러보기 ↗</a>', { showBrand: false });
    $$('[data-remove]',dialog).forEach(button => button.addEventListener('click', () => { cart.splice(Number(button.dataset.remove),1); updateCart(); showCart(); }));
  }
  $$('[data-cart]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); showCart(); }));
  updateCart();
  if (document.body.classList.contains('menu-list')) {
    const narrowMenu = window.matchMedia('(max-width: 800px)');
    $$('.menu_top .menu_txt, .menu_top .info_btn').forEach(row => {
      let drag = null;
      let suppressClick = false;

      row.addEventListener('pointerdown', event => {
        suppressClick = false;
        if (event.pointerType !== 'mouse' || event.button !== 0 || !narrowMenu.matches || row.scrollWidth <= row.clientWidth) return;
        drag = { id: event.pointerId, x: event.clientX, scrollLeft: row.scrollLeft };
      });
      row.addEventListener('pointermove', event => {
        if (event.pointerId !== drag?.id) return;
        const distance = event.clientX - drag.x;
        if (!suppressClick) {
          if (Math.abs(distance) < 6) return;
          suppressClick = true;
          row.setPointerCapture(event.pointerId);
          row.classList.add('is-dragging');
        }
        row.scrollLeft = drag.scrollLeft - distance;
      });

      function stopDrag(event) {
        if (event.pointerId !== drag?.id) return;
        drag = null;
        row.classList.remove('is-dragging');
      }
      row.addEventListener('pointerup', stopDrag);
      row.addEventListener('pointercancel', stopDrag);
      row.addEventListener('lostpointercapture', stopDrag);
      row.addEventListener('pointerleave', event => {
        if (!suppressClick) stopDrag(event);
      });
      row.addEventListener('click', event => {
        if (!suppressClick || !event.detail) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    });

    const cards = $$('.card_sub'); const normalize = text => text.replace(/\s/g,'').replaceAll('페페로니','페퍼로니').toLowerCase();
    cards.forEach((card,i) => { card.dataset.name = $('.name h3',card).textContent; $$('.card_link,.menu-product-title',card).forEach(link => link.href = `sub02.html?product=${i}&order=${orderType}`); $$('.bt',card).forEach(link => { link.removeAttribute('href'); }); });
    const filters = $$('.info_btn button:enabled'); let activeFilter = params.get('filter') === 'new' ? '새메뉴' : '전체메뉴';
    const groups = {'전체메뉴':cards.map((_,i)=>i),'새메뉴':[6,7],'인기메뉴':[0,1,2,3],'프리미엄':[0,4,5,6]};
    const search = $('.menu-search input'); search.value = params.get('q') || '';
    const empty = document.createElement('p'); empty.className = 'menu-empty'; empty.hidden = true; $('.menu_bottom').append(empty);
    function filter() {
      let count = 0;
      cards.forEach((card,i) => { const shown = (groups[activeFilter] || []).includes(i) && normalize(card.dataset.name).includes(normalize(search.value)); card.hidden = !shown; if(shown) count++; });
      $('.results-count').textContent = `피자 · ${count}개의 메뉴`;
      empty.hidden = count > 0; empty.textContent = search.value ? '검색 결과가 없어요. 다른 피자 이름으로 찾아보세요.' : '이 카테고리의 메뉴는 준비 중입니다. 전체 피자 메뉴를 둘러보세요.';
      filters.forEach(button => { const selected = normalize(button.textContent) === normalize(activeFilter); button.classList.toggle('is_active',selected); button.setAttribute('aria-pressed',selected); });
    }
    filters.forEach(button => button.addEventListener('click', () => { activeFilter = button.textContent.replace(/\s+/g,'').trim(); filter(); }));
    $('.menu_txt .txt:enabled').addEventListener('click', filter);
    search.addEventListener('input',filter); filter();
  }
  if (document.body.classList.contains('menu-detail')) {
    const products = [ ['리얼 BBQ불고기',29900,21900],['베이컨 포테이토',27900,21900],['오리지널 페퍼로니',25900,19900],['슈퍼슈프림',29900,21900],['트러플 머쉬룸 스테이크',33900,25900],['스파이시 바베큐 립',31900,23900],['쉬림프 갈릭 크림',32900,24900],['갈릭 크림 불닭',28900,22900] ];
    const parsed = Number(params.get('product') ?? 7); const productIndex = Number.isInteger(parsed) && parsed >= 0 && parsed < products.length ? parsed : 7;
    const product = products[productIndex]; $('#detail-title').textContent = product[0]; $('#detail-photo').src = `img/menu0${productIndex+1}.png`; $('#detail-photo').alt = product[0];
    $$('[name="pizza-size"]').forEach((input,i) => {input.value = String(product[i+1]); input.nextElementSibling.textContent = `${i?'M':'L'} · ${money(product[i+1])}원`;});
    const detailData = window.PIZZA_HUT_DETAIL_DATA;
    const sideQuantities = Object.fromEntries(detailData.sides.map(side => [side.id, 0]));
    $('#topping-options').insertAdjacentHTML('beforeend', detailData.toppings.map(topping => `<label class="topping-option"><input type="checkbox" name="pizza-topping" value="${topping.id}" /><img src="${topping.image}" alt="" width="40" height="40" /><span>${escapeHTML(topping.name)}<small>+${money(topping.price)}원</small></span></label>`).join(''));
    const sideMarkup = side => `<div class="side-option" data-side-row="${side.id}"><img src="${side.image}" alt="" width="48" height="48" /><span>${escapeHTML(side.name)}<small>${money(side.price)}원</small></span><div class="side-counter"><button type="button" data-side-id="${side.id}" data-side-change="-1" aria-label="${escapeHTML(side.name)} 수량 줄이기" disabled>−</button><output data-side-output="${side.id}" aria-label="${escapeHTML(side.name)} 수량" aria-live="polite">0</output><button type="button" data-side-id="${side.id}" data-side-change="1" aria-label="${escapeHTML(side.name)} 수량 늘리기">+</button></div></div>`;
    $('#side-options').innerHTML = detailData.sides.map(sideMarkup).join('');
    $$('[data-side-category]').forEach(container => container.innerHTML = detailData.sides.filter(side=>side.category===container.dataset.sideCategory).map(sideMarkup).join(''));
    const description=detailData.descriptions[product[0]];
    $('.detail-intro').textContent=description || '';
    $('.detail-intro').hidden=!description;
    let quantity = 1;
    function selectedToppings() { return detailData.toppings.filter(topping => $(`[name="pizza-topping"][value="${topping.id}"]`).checked); }
    function selectedSides() { return detailData.sides.filter(side => sideQuantities[side.id] > 0).map(side => ({...side, quantity:sideQuantities[side.id]})); }
    function pizzaBase() { return Number($('[name="pizza-size"]:checked').value) + Number($('[name="pizza-edge"]:checked').value); }
    function total() { return (pizzaBase() + selectedToppings().reduce((sum,topping) => sum + topping.price,0))*quantity + selectedSides().reduce((sum,side) => sum + side.price*side.quantity,0); }
    function renderTotal() {
      const medium = $('[name="pizza-size"]:checked').dataset.size === 'M';
      $$('[name="pizza-edge"]').forEach(input => {input.disabled = medium && input.dataset.edge.includes('라지');});
      if($('[name="pizza-edge"]:checked').disabled) $('[name="pizza-edge"]').checked=true;
      $('#detail-quantity').textContent=quantity; $('#detail-total').textContent=`${money(total())}원`; $('[data-quantity="-1"]').disabled=quantity<=1; $('[data-quantity="1"]').disabled=quantity>=10;
      const toppings = selectedToppings(); const sides = selectedSides();
      const toppingStatus = $('#topping-status'); toppingStatus.textContent = toppings.length ? `${toppings.length}종 선택` : '선택 안 함'; toppingStatus.classList.toggle('has-selection',toppings.length>0);
      const sideStatus = $('#side-status'); sideStatus.textContent = sides.length ? `${sides.reduce((sum,side)=>sum+side.quantity,0)}개 선택` : '선택 안 함'; sideStatus.classList.toggle('has-selection',sides.length>0);
      detailData.sides.forEach(side => { const count = sideQuantities[side.id]; $$(`[data-side-output="${side.id}"]`).forEach(output=>output.textContent=count); $$(`[data-side-id="${side.id}"][data-side-change="-1"]`).forEach(button=>button.disabled=count===0); $$(`[data-side-id="${side.id}"][data-side-change="1"]`).forEach(button=>button.disabled=count===10); $$(`[data-side-row="${side.id}"]`).forEach(row=>row.classList.toggle('has-selection',count>0)); });
      $$('[data-category-status]').forEach(status=>{const count=sides.filter(side=>side.category===status.dataset.categoryStatus).reduce((sum,side)=>sum+side.quantity,0);status.textContent=count?`${count}개 선택`:'선택 안 함';status.classList.toggle('has-selection',count>0);});
      $('#dock-pizza').textContent=`${product[0]} ${$('[name="pizza-size"]:checked').dataset.size} · ${$('[name="pizza-edge"]:checked').dataset.edge} · ${quantity}판`;
      $('#dock-toppings').textContent=toppings.length?toppings.map(topping=>topping.name).join(', '):'선택 안 함';
      $('#dock-sides').textContent=sides.length?sides.map(side=>`${side.name} ${side.quantity}개`).join(', '):'선택 안 함';
      $('#selection-breakdown').innerHTML = `<div><dt>피자 ${$('[name="pizza-size"]:checked').dataset.size} · ${escapeHTML($('[name="pizza-edge"]:checked').dataset.edge)} × ${quantity}</dt><dd>${money(pizzaBase()*quantity)}원</dd></div>${toppings.map(topping=>`<div class="breakdown-extra"><dt>+ ${escapeHTML(topping.name)} × ${quantity}</dt><dd>${money(topping.price*quantity)}원</dd></div>`).join('')}${sides.map(side=>`<div><dt>${escapeHTML(side.name)} × ${side.quantity}</dt><dd>${money(side.price*side.quantity)}원</dd></div>`).join('')}`;
    }
    $$('[data-quantity]').forEach(button => button.addEventListener('click', () => {quantity=Math.max(1,Math.min(10,quantity+Number(button.dataset.quantity)));renderTotal();}));
    $$('[name="pizza-size"],[name="pizza-edge"],[name="pizza-topping"]').forEach(input => input.addEventListener('change',renderTotal));
    $$('[data-side-change]').forEach(button => button.addEventListener('click', () => { const id=button.dataset.sideId; sideQuantities[id]=Math.max(0,Math.min(10,sideQuantities[id]+Number(button.dataset.sideChange))); renderTotal(); }));
    const orderDetailToggle=$('#toggle-order-detail');
    function closeOrderDetail(){orderDetailToggle.setAttribute('aria-expanded','false');$('#dock-selection').hidden=true;}
    orderDetailToggle.addEventListener('click',()=>{const open=orderDetailToggle.getAttribute('aria-expanded')!=='true';orderDetailToggle.setAttribute('aria-expanded',String(open));$('#dock-selection').hidden=!open;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#dock-selection').hidden){closeOrderDetail();orderDetailToggle.focus();}});
    document.addEventListener('click',event=>{if(!event.target.closest('.order-dock'))closeOrderDetail();});
    $('#add-pizza').addEventListener('click', () => { const size = $('[name="pizza-size"]:checked').dataset.size; const edge = $('[name="pizza-edge"]:checked').dataset.edge; const item={name:product[0],size,edge,quantity,toppings:selectedToppings().map(({id,name,price})=>({id,name,price})),sides:selectedSides().map(({id,name,price,quantity})=>({id,name,price,quantity})),total:total()}; cart.push(item); updateCart(); openDialog('맛있는 선택, 담았어요!',`<p>${escapeHTML(product[0])}<br />${size} · ${escapeHTML(edge)} · ${quantity}개</p>${cartOptionsMarkup(item)}<p><strong>${money(item.total)}원</strong></p><p>이 장바구니는 실제 주문으로 이어지지 않는 화면 체험용입니다.</p><button type="button" class="btn btn-red" id="view-cart">장바구니 보기</button>`); $('#view-cart',dialog).addEventListener('click',showCart); });
    function showFoodInformation(initialTab) {
      const tabs=[['origin','원산지'],['nutrition','영양정보'],['allergen','알레르기']];
      const categories=[['pizza','피자'],['chicken','치킨'],['pasta','파스타&사이드'],['drinks','음료&기타']];
      let activeTab=initialTab; let activeCategory='pizza';
      const tabButtons=(items,attribute,prefix)=>items.map(([key,label])=>`<button type="button" role="tab" id="${prefix}-${key}" aria-controls="${prefix==='food-tab'?'food-type-panel':'food-category-panel'}" aria-selected="false" tabindex="-1" ${attribute}="${key}">${label}</button>`).join('');
      openDialog('원산지 · 영양정보 · 알레르기 유발성분 정보', `<p class="food-dialog-subtitle">현재 선택 메뉴 · ${escapeHTML(product[0])}</p><div class="food-tabs" role="tablist" aria-label="메뉴 정보 종류">${tabButtons(tabs,'data-info-tab','food-tab')}</div><section class="food-type-panel" id="food-type-panel" role="tabpanel" aria-labelledby="food-tab-origin"><div class="food-categories" role="tablist" aria-label="메뉴 분류">${tabButtons(categories,'data-food-category','food-category')}</div><div class="food-scroll food-category-panel" id="food-category-panel" role="tabpanel" aria-labelledby="food-category-pizza" tabindex="0"></div></section>`);
      dialog.classList.add('food-details-dialog');
      function renderInformation(){
        const rows=activeCategory==='pizza'?detailData.origins.map(item=>({name:item.name,origin:item.text})):detailData.sides.filter(side=>side.category===activeCategory).map(side=>({name:side.name}));
        const categoryLabel=categories.find(([key])=>key===activeCategory)[1];
        const title=tabs.find(([key])=>key===activeTab)[1];
        const heading=`<div class="food-result-heading"><h3>${escapeHTML(categoryLabel)} · ${title}</h3><span>${rows.length}개 메뉴</span></div>`;
        const missing='<span class="food-missing">미등록</span>';
        let table='';
        if(rows.length){
          const columns=activeTab==='origin'?['메뉴','원산지 정보']:activeTab==='allergen'?['메뉴','알레르기 유발성분']:['메뉴','표시 기준','열량 (kcal)','단백질 (g)','포화지방 (g)','당류 (g)','나트륨 (mg)'];
          const cells=rows.map(row=>{
            const current=row.name===product[0];
            let values;
            if(activeTab==='origin')values=[row.origin?escapeHTML(row.origin):missing];
            else if(activeTab==='allergen'){const data=detailData.allergens[row.name];values=[Array.isArray(data)&&data.length?data.map(escapeHTML).join(', '):missing];}
            else{const data=detailData.nutrition[row.name];values=['serving','energy','protein','saturatedFat','sugar','sodium'].map(key=>data?.[key]!=null?escapeHTML(data[key]):missing);}
            return `<tr class="${current?'is-current':''}"><th scope="row" class="menu-name-cell">${escapeHTML(row.name)}${current?'<br /><span class="current-menu-tag">선택한 메뉴</span>':''}</th>${values.map(value=>`<td>${value}</td>`).join('')}</tr>`;
          }).join('');
          table=`<div class="food-table-wrap"><table class="food-table ${activeTab==='nutrition'?'food-table-nutrition':''}"><caption class="sr-only">${escapeHTML(categoryLabel)} ${title}</caption><thead><tr>${columns.map((label,index)=>`<th scope="col" class="${index===0?'menu-name-cell':''}">${label}</th>`).join('')}</tr></thead><tbody>${cells}</tbody></table></div>`;
        }else table='<div class="food-empty"><strong>등록된 메뉴 정보가 없습니다.</strong><p>선택한 분류의 메뉴 정보는 준비 중입니다.</p></div>';
        const note=activeTab==='allergen'?'※ 미등록은 알레르기 유발성분이 없다는 뜻이 아닙니다. 추가 토핑·사이드의 성분은 다를 수 있으니 주문 전 이용 매장에 확인해 주세요.':activeTab==='nutrition'?'※ 등록된 영양 수치가 없는 항목은 미등록으로 표시합니다. 사이즈·도우·추가 토핑에 따라 영양정보가 달라질 수 있습니다.':'※ 제공된 메뉴 자료 기준입니다. 미등록 항목과 실제 원산지는 주문 매장의 안내를 확인해 주세요.';
        $('#food-category-panel',dialog).innerHTML=heading+table+`<p class="food-note">${note}</p>`;
        $('#food-type-panel',dialog).setAttribute('aria-labelledby',`food-tab-${activeTab}`);
        $('#food-category-panel',dialog).setAttribute('aria-labelledby',`food-category-${activeCategory}`);
        $('#food-category-panel',dialog).scrollTop=0;
      }
      function setSelected(selector,attribute,key){$$(selector,dialog).forEach(button=>{const selected=button.getAttribute(attribute)===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});}
      function selectTab(key){activeTab=key;setSelected('[data-info-tab]','data-info-tab',key);renderInformation();}
      function selectCategory(key){activeCategory=key;setSelected('[data-food-category]','data-food-category',key);renderInformation();}
      function bindTabs(selector,items,select){$$(selector,dialog).forEach((button,index)=>{button.addEventListener('click',()=>select(items[index][0]));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%items.length;else if(event.key==='ArrowLeft')next=(index+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else return;event.preventDefault();select(items[next][0]);$$(selector,dialog)[next].focus();});});}
      bindTabs('[data-info-tab]',tabs,selectTab);bindTabs('[data-food-category]',categories,selectCategory);
      setSelected('[data-info-tab]','data-info-tab',activeTab);setSelected('[data-food-category]','data-food-category',activeCategory);renderInformation();
    }
    $$('[data-food-tab]').forEach(button=>button.addEventListener('click',()=>showFoodInformation(button.dataset.foodTab)));
    renderTotal();
  }
  if (document.body.classList.contains('login-page')) {
    const demoId = 'pizzahut-demo';
    const demoPassword = 'PizzaDemo123!';
    const form = $('.login_all');
    const id = $('.id', form);
    const password = $('.pw', form);
    const saveId = $('#save_id', form);
    const menuUrl = `sub01.html?order=${encodeURIComponent(orderType)}`;
    saveId.checked = storage.get('saved-demo-id') === demoId;
    id.value = demoId;
    password.value = demoPassword;
    $('.box.inactive', form).addEventListener('click', () => { location.href = menuUrl; });

    [id, password].forEach(input => {
      input.addEventListener('input', () => password.setCustomValidity(''));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (id.value.trim() !== demoId || password.value !== demoPassword) {
        password.setCustomValidity('체험용 아이디 또는 비밀번호가 일치하지 않아요.');
        password.reportValidity();
        return;
      }
      storage.set('demo-signed-in', true, 'sessionStorage');
      storage.set('saved-demo-id', saveId.checked ? demoId : '');
      location.replace('index.html');
    });
  }
  // Unimplemented destinations explain their current state instead of jumping to the top.
  $$('a[href="#"]').forEach(link => {
    if(link.matches('.more_btn,[data-location],[data-cart],[data-business]'))return;
    link.addEventListener('click',event=>{event.preventDefault();openDialog(link.textContent.trim() || link.getAttribute('aria-label') || '서비스 안내','<p>현재 디자인 미리보기에서 이 서비스는 연결 전입니다. 메뉴 탐색과 장바구니 담기를 체험해 보세요.</p><a class="btn btn-red" href="sub01.html">메뉴 둘러보기</a>');});
  });
});
