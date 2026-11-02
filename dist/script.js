const thoughts = {
  discover: {title:'先把问题问对。', body:'在讨论模型和功能之前，先回到具体的人与场景：谁遇到了什么困难？他们今天怎样解决？这件事，真的需要 AI 吗？', note:'从真实需求出发，而不是从技术名词出发。', symbol:'?'},
  validate: {title:'把假设，放进真实场景。', body:'用一个足够小的原型，验证最重要的假设。让使用者亲手试一试，观察他们在哪一步停下来，再决定下一步值得投入什么。', note:'一个可验证的小步，胜过一份完美的大计划。', symbol:'↗'},
  deliver: {title:'让有用，也变得好用。', body:'好的体验，藏在每一个具体的反馈里：等待时是否有预期，出错时是否有退路，结果是否容易理解。让 AI 能力真正融入日常使用。', note:'交付不是终点，真实的使用才是新的开始。', symbol:'+'}
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panel = document.querySelector('#thought-panel');
function selectTab(tab, focus = false) {
  tabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
  const thought = thoughts[tab.dataset.step];
  panel.querySelector('h3').textContent = thought.title;
  panel.querySelector('p').textContent = thought.body;
  panel.querySelector('.thought-note').textContent = thought.note;
  panel.querySelector('.thought-symbol').textContent = thought.symbol;
  panel.setAttribute('aria-labelledby', tab.id);
  if (focus) tab.focus();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp') next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home') next=0;
    if(event.key==='End') next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectTab(tabs[next],true);}
  });
});
document.querySelectorAll('a[href="#site-story"]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#site-story').open=true;}));
document.querySelector('#year').textContent = new Date().getFullYear();
