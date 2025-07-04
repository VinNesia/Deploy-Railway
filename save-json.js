const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { content, type } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'JSON content is required' });
    }

    try {
        if (type === 'gist') {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'JSON from JSON Beautifier',
                    public: false,
                    files: { 'data.json': { content } }
                })
            });
            const data = await response.json();
            if (response.ok) {
                return res.status(200).json({ html_url: data.html_url });
            }
            return res.status(response.status).json({ message: data.message });
        } else if (type === 'database') {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
            const { data, error } = await supabase
                .from('jsons')
                .insert([{ content }])
                .select('id')
                .single();
            if (error) throw error;
            return res.status(200).json({ id: data.id });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
