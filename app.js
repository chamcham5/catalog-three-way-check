const $=id=>document.getElementById(id);let report='';
const labels={unchanged:'変更なし',current_only:'現在だけ変更（保持の判断候補）',proposed_only:'編集案だけ変更',same_change:'同じ変更',conflict:'競合（採用値未定）'};
function reset(){report='';$('result').replaceChildren();$('result').hidden=true;}
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
for(const id of ['before','current','proposed','key','captured','confirmed'])$(id).addEventListener('input',()=>{reset();if(['before','current','proposed','key'].includes(id))$('confirmed').checked=false;});
$('sample').addEventListener('click',()=>{reset();$('before').value='row_key,Price,Vendor,Option1 Value\n001,1000,Acme,Red\n002,2000,Beta,Large';$('current').value='row_key,Price,Vendor,Option1 Value\n001,1200,Acme,Red\n002,2200,Beta,Large';$('proposed').value='row_key,Price,Vendor,Option1 Value\n001,1100,,Blue\n002,2000,Beta,Large';$('captured').value='2026-10-12 15:00 JST（架空サンプル）';$('key').value='row_key';$('confirmed').checked=false;});
$('clear').addEventListener('click',()=>{for(const id of ['before','current','proposed','captured'])$(id).value='';$('confirmed').checked=false;reset();});
$('compare').addEventListener('submit',e=>{e.preventDefault();reset();const r=CatalogInput.compare({before:$('before').value,current:$('current').value,proposed:$('proposed').value,key:$('key').value,captured:$('captured').value,confirmed:$('confirmed').checked});const out=$('result');out.hidden=false;
if(!r.ok){out.append(node('h2','入力を確認してください'));const p=node('p',r.error.code+'：'+r.error.message);p.className='error';out.append(p);return;}
out.append(node('h2','比較結果（確認票）'));for(const text of [`${r.summary.row_count}行を比較`,`競合 ${r.summary.conflict_count}セル`,`注意点 ${r.findings.length}件`]){const b=node('span',text);b.className='badge';out.append(b);}
out.append(node('p','取得日時は記録値です。取得後の鮮度は未確認です。結果をそのままインポートしないでください。'));
const table=document.createElement('table'),head=document.createElement('tr');for(const h of ['キー','列','基準','現在','編集案の比較値','分類'])head.append(node('th',h));table.append(head);
let shown=0,totalChanged=0;const lines=['商品CSVの三者比較・確認票',`対応キー: ${$('key').value}`,`現在CSV取得日時（利用者入力）: ${$('captured').value}`,`比較行数: ${r.summary.row_count} / 競合セル: ${r.summary.conflict_count}`, '鮮度未検証。採用値や修正済みCSVは出力していません。'];
for(const [key,cells]of Object.entries(r.derived.cells))for(const [field,c]of Object.entries(cells)){if(c.status==='unchanged')continue;totalChanged++;lines.push(JSON.stringify({key,field,base:c.base,current:c.current,proposed:c.proposed,status:labels[c.status]}));if(shown++<200){const tr=document.createElement('tr');for(const v of [key,field,c.base,c.current,c.proposed,labels[c.status]])tr.append(node('td',v));table.append(tr);}}
if(totalChanged){const wrap=document.createElement('div');wrap.className='scroll';wrap.append(table);out.append(wrap);}else out.append(node('p','比較対象セルに変更はありません。'));
out.append(node('p',`変更セル ${totalChanged}件中、表には最大200件を表示。確認票には全件を含みます。省略した行・列は基準値として三者分類されますが、実インポートの自動保持を保証しません。`));
for(const [i,f]of r.findings.entries()){if(i<200)out.append(node('p',f.rule_id+'：'+f.message));lines.push(JSON.stringify(f));}if(r.findings.length>200)out.append(node('p','注意点も画面は先頭200件です。全件は確認票の全文で確認できます。'));
report=lines.join('\n');const copy=node('button','確認票をコピー');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report);copy.textContent='確認票をコピーしました';}catch{copy.textContent='コピーできませんでした。下の確認票を選択してください。';}});out.append(copy);const details=document.createElement('details');details.append(node('summary','確認票の全文'));details.append(node('pre',report));out.append(details);
});
