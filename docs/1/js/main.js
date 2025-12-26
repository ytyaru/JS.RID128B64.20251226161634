window.addEventListener('DOMContentLoaded', (event) => {
    const BTN = document.querySelector('#generate');
    const TXT = document.querySelector('#ids');
    BTN.addEventListener('click', ()=>{
        const ID = RID128B64.get();
        copyToClipboard(ID);
        TXT.textContent = ID + '\n' + TXT.textContent;
    });
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

