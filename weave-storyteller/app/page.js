'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

// Component that handles calling the Vertex API for an image
function ImageSegment({ prompt }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetch('/api/image', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        }).then(res => res.json()).then(data => {
            if (!mounted) return;
            if (data.imageUrl) setImageUrl(data.imageUrl);
            setLoading(false);
        }).catch(err => {
            if (!mounted) return;
            console.error(err);
            setLoading(false);
        })
        return () => mounted = false;
    }, [prompt]);

    if (loading) return <div className={styles.imageContainer}><div className={styles.skeleton}>Visualizing: "{prompt.substring(0, 30)}..."</div></div>;
    if (!imageUrl) return null;
    return <div className={styles.imageContainer}><img src={imageUrl} alt={prompt} className={styles.storybookImage} /></div>;
}

// Optional TTS Component for audio playback
function AudioPlayer({ text }) {
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [audioData, setAudioData] = useState(null);

    const playAudio = async () => {
        if (audioData) {
            new Audio(`data:audio/mp3;base64,${audioData}`).play();
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (data.audioContent) {
                setAudioData(data.audioContent);
                new Audio(`data:audio/mp3;base64,${data.audioContent}`).play();
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={playAudio} className={styles.audioButton} title="Listen to this segment">
            {loading ? '...' : '▶'}
        </button>
    );
}

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contentStream, setContentStream] = useState([]);
  
  const bottomRef = useRef(null);

  useEffect(() => {
     if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [contentStream]);
  
  const generateStory = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    setContentStream([]);
    
    try {
        const response = await fetch('/api/story', {
           method: 'POST',
           body: JSON.stringify({ prompt: input })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        
        while(true) {
           const { done, value } = await reader.read();
           if (done) break;
           
           fullText += decoder.decode(value, { stream: true });
           
           const sections = [];
           const regex = /<image>(.*?)<\/image>/g;
           let lastIndex = 0;
           let match;
           
           while ((match = regex.exec(fullText)) !== null) {
               if (match.index > lastIndex) {
                   sections.push({ type: 'text', content: fullText.substring(lastIndex, match.index), id: lastIndex });
               }
               // id is the match index so it's stable and React doesn't unmount the image!
               sections.push({ type: 'image', content: match[1], id: match.index + "_img" });
               lastIndex = match.index + match[0].length;
           }
           if (lastIndex < fullText.length) {
               sections.push({ type: 'text', content: fullText.substring(lastIndex), id: lastIndex });
           }
           setContentStream(sections);
        }
    } catch(err) {
        console.error(err);
    } finally {
        setIsLoading(false);
        setInput('');
    }
  };

  return (
    <div className={styles.container}>
      {contentStream.length === 0 && (
          <div className={styles.header}>
            <h1 className={styles.title}>Weave</h1>
            <p className={styles.subtitle}>Enter a prompt, and the AI Creative Director will weave a dynamic, multimodal story just for you.</p>
          </div>
      )}

      <div className={styles.feed}>
        {contentStream.map((section) => {
            if (section.type === 'text') {
                // Split paragraphs
                return (
                    <div key={section.id} className={styles.textChunk}>
                        <AudioPlayer text={section.content} />
                        {section.content.split('\n').map((p, i) => p.trim() ? <p key={i}>{p}</p> : null)}
                    </div>
                );
            } else if (section.type === 'image') {
                return <ImageSegment key={section.id} prompt={section.content} />;
            }
            return null;
        })}
        <div ref={bottomRef} style={{ height: '50px' }} />
      </div>

      <div className={styles.inputWrapper}>
        <form onSubmit={generateStory} className={styles.inputGlass}>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="E.g. A cyberpunk detective searching for a mechanical cat..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className={styles.button} disabled={isLoading || !input.trim()}>
              {isLoading ? 'Weaving...' : 'Generate'}
            </button>
        </form>
      </div>
    </div>
  );
}
