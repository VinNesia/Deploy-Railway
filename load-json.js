const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { gistId, jsonId } = req.query;

    try {
        if (gistId) {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: { 'Accept': 'application/vnd.github+json' }
            });
            const data = await response.json();
            if (response.ok && data.files && data.files['data.json']) {
                return res.status(200).json({ content: data.files['data.json'].content });
            }
            return res.status(404).json({ message: 'No valid JSON found in Gist' });
        } else if (jsonId) {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
            const { data, error } = await supabase
                .from('jsons')
                .select('content')
                .eq('id', jsonId)
                .single();
            if (error) throw error;
            if (data) {
                return res.status(200).json({ content: data.content });
            }
            return res.status(404).json({ message: 'No JSON found with this ID' });
        }
        return res.status(400).json({ message: 'Gist ID or JSON ID required' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
