<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Anda sedang offline. Periksa koneksi internet Anda.">
    <meta name="robots" content="noindex">
    <title data-i18n="offlineTitle">Offline - AI Tools Directory</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/images/icon-192x192.png" type="image/png">
    <script src="https://cdn.jsdelivr.net/npm/i18next@21.9.2/dist/umd/i18next.min.js"></script>
    <script src="/locales/id.json"></script>
    <script src="/locales/en.json"></script>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">
                <a href="index.html" aria-label="AI Tools Directory Beranda">AI Tools Directory</a>
            </div>
        </div>
    </header>
    <section class="content">
        <div class="container">
            <h1 data-i18n="offlineTitle">Anda Offline</h1>
            <p data-i18n="offlineMessage">Silakan periksa koneksi internet Anda dan coba lagi.</p>
            <a href="index.html" class="btn" data-i18n="backToHome">Kembali ke Beranda</a>
        </div>
    </section>
    <footer>
        <div class="container">
            <p>© 2025 AI Tools Directory. <span data-i18n="footerRights">Semua hak dilindungi.</span></p>
        </div>
    </footer>
    <script>
        i18next.init({
            lng: localStorage.getItem('language') || 'id',
            resources: {
                id: { translation: idTranslations },
                en: { translation: enTranslations }
            }
        }, function(err, t) {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.textContent = i18next.t(key);
            });
        });
    </script>
</body>
</html>
