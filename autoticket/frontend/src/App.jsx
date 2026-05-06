import { useState } from 'react';
import axios from 'axios';
import { Bot, FileText, Image as ImageIcon, Send, UploadCloud, CheckCircle2 } from 'lucide-react';

function App() {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (description) formData.append('description', description);
    if (file) formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      // Send to FastAPI backend
      const response = await axios.post(`${apiUrl}/api/resolve-ticket`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      setResult({ error: "Failed to resolve ticket. Is the backend running on port 8001?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div>
          <h1>AutoResolve Desk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Semantic Ticket Classification & OCR</p>
        </div>
        <Bot size={40} color="var(--primary-accent)" />
      </header>

      <div className="grid">
        {/* Left Column: Input Form */}
        <div className="panel">
          <h2 className="panel-title"><FileText size={20} /> Submit New Ticket</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Issue Description (Noisy text is fine)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. my screen is totally black no power"
              />
            </div>
            
            <div className="form-group">
              <label>Attach Screenshot / Image (Optional)</label>
              <div 
                className="file-drop" 
                onClick={() => document.getElementById('fileUpload').click()}
              >
                <input 
                  type="file" 
                  id="fileUpload" 
                  hidden 
                  accept="image/*"
                  onChange={(e) => setFile(e.target[0] || e.target.files[0])}
                />
                {file ? (
                  <div style={{ color: 'var(--secondary-accent)' }}>
                    <ImageIcon size={24} style={{ marginBottom: '0.5rem' }}/>
                    <br/>{file.name}
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={24} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}/>
                    <br/>Click to upload screenshot
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading || (!description && !file)}>
              {loading ? 'Resolving...' : <><Send size={18} /> Resolve Instantly</>}
            </button>
          </form>
        </div>

        {/* Right Column: Resolution Output */}
        <div className="panel">
          <h2 className="panel-title"><CheckCircle2 size={20} /> AI Resolution Analysis</h2>
          
          {loading ? (
            <div className="loader"></div>
          ) : result ? (
            result.error ? (
              <div style={{ color: '#ff4757' }}>{result.error}</div>
            ) : (
              <div className="result-box">
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Predicted Category</div>
                  <div className="category-badge">
                    {result.classification}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${result.confidence}%` }}></div>
                  </div>
                </div>

                <div className="solution-box">
                  <div className="solution-title">Suggested Standard Operating Procedure (SOP)</div>
                  <div style={{ lineHeight: '1.6' }}>{result.suggested_solution}</div>
                </div>
                
                {result.ocr_used && (
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <strong>Extracted Text from Image (OCR):</strong><br/>
                    {result.input_text.replace(description, '').trim() || "No readable text found."}
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>
              Submit a ticket to see the semantic vector search in action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
