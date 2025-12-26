window.addEventListener('DOMContentLoaded', (event) => {
    const a = new Assertion();
    a.t(()=>{
        const ID = RID128B64.get();
        console.log(ID);
        console.log(ID.length);
        console.log(!!ID.match(/^A-Za-z0-9\-_$/));
        return 22===ID.length && !!ID.match(/^[A-Za-z0-9\-_]{22}$/);
    });
    a.fin();
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

