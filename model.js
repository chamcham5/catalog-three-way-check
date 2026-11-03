(function(root,factory){const api=factory(typeof module==='object'?require('./business.js'):root.BusinessCore);if(typeof module==='object')module.exports=api;else root.CatalogInput=api;})(this,function(core){
  function parseCSV(raw){
    if(typeof raw!=='string'||!raw.trim())throw Error('見出しとデータ行のあるCSVを貼り付けてください。');
    if(new TextEncoder().encode(raw).length>500000)throw Error('各CSVはUTF-8換算500KBまでです。');
    const s=raw.replace(/^\uFEFF/,'');let rows=[],row=[],cell='',quoted=false,after=false;
    const push=()=>{row.push(cell);cell='';after=false;};
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(quoted){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++;}else{quoted=false;after=true;}}else cell+=c;continue;}
      if(after&&c!==','&&c!=='\r'&&c!=='\n')throw Error('閉じ引用符の後には区切りか改行が必要です。');
      if(c==='"'){if(cell!=='')throw Error('セル途中の引用符は二重引用符で囲んでください。');quoted=true;}
      else if(c===','){push();}
      else if(c==='\r'||c==='\n'){push();rows.push(row);row=[];if(c==='\r'&&s[i+1]==='\n')i++;}
      else cell+=c;
    }
    if(quoted)throw Error('閉じていない引用符があります。');
    if(cell!==''||row.length||after){push();rows.push(row);}
    const headers=rows.shift();if(!headers||headers.length<2||headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('空でない重複なしの見出しを2列以上指定してください。');
    if(!rows.length||rows.length>1000)throw Error('各CSVは1～1000データ行で指定してください。');
    if(headers.length>50)throw Error('各CSVは50列までです。');
    const data=rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`データ行${i+1}の列数が見出しと違います。末尾の空欄もカンマで明示してください。`);const o=Object.create(null);headers.forEach((h,j)=>{o[h]=r[j];});return o;});
    return {headers,data};
  }
  function compare(input){
    try{
      if(!input.confirmed)throw Error('同じ不変キーを3枚で対応付けたことを確認してください。');
      if(!input.captured||!input.captured.trim())throw Error('更新直前の取得日時を記録してください。');
      const b=parseCSV(input.before),c=parseCSV(input.current),p=parseCSV(input.proposed),key=input.key;
      if(!key||![b,c,p].every(t=>t.headers.includes(key)))throw Error('対応キー列が3枚すべてに必要です。SKUの一意性は自動判定しません。');
      const result=core.execute({tool:'catalog_three_way_guard',arguments:{profile:'shopify_product_csv',key_field:key,before:b.data,current:c.data,proposed:p.data,proposed_columns:p.headers.filter(h=>h!==key),current_captured_at:input.captured,overwrite_mode:true}});
      return {ok:!result.error,...result};
    }catch(e){return {ok:false,error:{code:'CSV_INPUT',message:e.message}};}
  }
  return {parseCSV,compare};
});
