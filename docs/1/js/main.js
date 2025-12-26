window.addEventListener('DOMContentLoaded', (event) => {
    const BTN = document.querySelector('#generate');
    const TXT = document.querySelector('#ids');
    const CTX = document.querySelector('#context');
    const CSC = document.querySelector('#copySourceCode');
//    const SRC = document.querySelector('#sourceCode');
    const HSC = document.querySelector('#hljsSourceCode');
    const CODES = {js:'', mjs:'', cjs:''}
    const HTMLS = {js:'', mjs:'', cjs:''}
    BTN.addEventListener('click', ()=>{
        const ID = RID128B64.get();
        copyToClipboard(ID);
        TXT.textContent = ID + '\n' + TXT.textContent;
    });
    CTX.addEventListener('input', async(e)=>{
        if (!CODES[e.target.value]) {
            const res = await fetch(`js/rid128b64.${e.target.value}`);
            console.log(`HTTP status:`, res.status);
            CODES[e.target.value] = await res.text();
            HTMLS[e.target.value] = hljs.highlight(CODES[e.target.value], {language:'JavaScript'}).value;
            console.log(HTMLS[e.target.value]);
        }
//        SRC.textContent = CODES[e.target.value];
        HSC.innerHTML = HTMLS[e.target.value];
    });
    CSC.addEventListener('click', ()=>{
        copyToClipboard(CODES[CTX.value]);
    });
    CTX.dispatchEvent(new Event('input'));
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

