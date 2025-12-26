async function copyToClipboard(text) {
    // 1. モダンな Clipboard API (HTTPS環境用)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Clipboard API: コピー成功');
            return true;
        } catch (err) {console.error('Clipboard API: コピー失敗', err);}
    }
    // 2. フォールバック処理 (HTTP環境や古いブラウザ用)
    try {
        // 一時的な textarea 要素を作成
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // 画面外に配置（スクロールを防ぐ工夫）
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        // テキストを選択してコピーを実行
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        // 要素を削除
        document.body.removeChild(textArea);
        if (successful) {console.log('Fallback: クリップボードのコピーに成功');}
        return true;
    } catch (err) {console.error(`クリップボードのコピーに失敗しました。clipboard.writeTextが使えず、document.execCommand('copy')も使えませんでした。`)}
    return false;
}
