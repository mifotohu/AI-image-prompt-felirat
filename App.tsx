import React, { useState, useCallback } from 'react';
import { INSTAGRAM_SVG, PINTEREST_SVG, GENERATOR_SVG } from './constants';
import { AspectRatios } from './types';
import { ASPECT_RATIO_CONFIG } from './constants';

interface GeneratedImage {
  url: string;
  name: string;
}

// Helper function to calculate text lines for wrapping
const getTextLines = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] => {
    // Replace newlines with spaces to ensure continuous flow, then split by spaces
    const cleanText = text.replace(/\n/g, ' ');
    const words = cleanText.split(' ');
    let line = '';
    const lines: string[] = [];

    if (!text) return [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    return lines;
};

const RefreshIcon: React.FC = () => (
  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
    <path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/>
  </svg>
);


const App: React.FC = () => {
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('panning shot of a mysterious female figure, studio light, solid orange background, motion blur, matte faded film effect --stylize 800');
  const [socialHandle, setSocialHandle] = useState<string>('@pragerfoto');
  const [generatorName, setGeneratorName] = useState<string>('Midjourney');
  const [selectedRatios, setSelectedRatios] = useState<Record<AspectRatios, boolean>>({
    '9:16': true,
    '2:3': false,
    '3:4': false,
    '4:5': false,
    '1:1': false,
    '5:4': false,
    '4:3': false,
    '16:9': false,
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const ratioOrder: AspectRatios[] = ['9:16', '2:3', '3:4', '4:5', '1:1', '5:4', '4:3', '16:9'];


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = (Array.from(files) as File[])
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 3); // Limit to 3 files

      if (validFiles.length === 0) {
        setError("Kérlek, csak képfájlokat tölts fel.");
        return;
      }

      Promise.all(validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })).then(images => {
        setSourceImages(images);
        setGeneratedImages([]);
        setError(null);
      });
    }
  };

  const handleRatioChange = (ratio: AspectRatios) => {
    setSelectedRatios(prev => ({ ...prev, [ratio]: !prev[ratio] }));
  };

  const generateImage = useCallback(async () => {
    if (sourceImages.length === 0) {
      setError("A generáláshoz először tölts fel legalább egy képet.");
      return;
    }
    
    const activeRatios = Object.entries(selectedRatios)
      .filter(([, isSelected]) => isSelected)
      .map(([ratio]) => ratio as AspectRatios);

    if (activeRatios.length === 0) {
      setError("Kérlek, válassz legalább egy képarányt.");
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]);
    setError(null);

    try {
      // Process all source images
      const allGeneratedImagesPromises = sourceImages.map(async (src, imgIndex) => {
        return new Promise<GeneratedImage[]>(async (resolve, reject) => {
          const image = new Image();
          image.src = src;
          
          image.onload = async () => {
            try {
              const imagesForSource = await Promise.all(
                activeRatios.map(async (ratio) => {
                  const config = ASPECT_RATIO_CONFIG[ratio];
                  const canvas = document.createElement('canvas');
                  canvas.width = config.width;
                  canvas.height = config.height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Could not get canvas context');

                  // --- Draw Image with "cover" effect ---
                  const canvasRatio = canvas.width / canvas.height;
                  const imageRatio = image.width / image.height;
                  let sx, sy, sWidth, sHeight;

                  if (imageRatio > canvasRatio) { // Image is wider
                    sHeight = image.height;
                    sWidth = image.height * canvasRatio;
                    sx = (image.width - sWidth) / 2;
                    sy = 0;
                  } else { // Image is taller or same ratio
                    sWidth = image.width;
                    sHeight = image.width / canvasRatio;
                    sx = 0;
                    sy = (image.height - sHeight) / 2;
                  }
                  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                  
                  // --- Draw Social Media & Generator Overlay ---
                  if (socialHandle.trim() !== '' || generatorName.trim() !== '') {
                    const loadIcon = (svg: string): Promise<HTMLImageElement> => {
                      return new Promise((resolve, reject) => {
                        const icon = new Image();
                        icon.onload = () => resolve(icon);
                        icon.onerror = reject;
                        icon.src = `data:image/svg+xml;base64,${btoa(svg.replace('{color}', 'white'))}`;
                      });
                    };
                    
                    const iconsToLoad: Promise<HTMLImageElement>[] = [];
                    if (socialHandle.trim() !== '') {
                        iconsToLoad.push(loadIcon(INSTAGRAM_SVG));
                        iconsToLoad.push(loadIcon(PINTEREST_SVG));
                    }
                    if (generatorName.trim() !== '') {
                        iconsToLoad.push(loadIcon(GENERATOR_SVG));
                    }

                    const loadedIcons = await Promise.all(iconsToLoad);
                    let iconIndex = 0;
                    let instaIcon, pinterIcon, genIcon;
                    if (socialHandle.trim() !== '') {
                        instaIcon = loadedIcons[iconIndex++];
                        pinterIcon = loadedIcons[iconIndex++];
                    }
                    if (generatorName.trim() !== '') {
                        genIcon = loadedIcons[iconIndex];
                    }

                    const padding = canvas.width * 0.03;
                    const iconSize = canvas.width * 0.035;
                    const textPadding = iconSize * 0.3;
                    const socialFont = `bold ${iconSize * 0.7}px "Inter", sans-serif`;
                    ctx.font = socialFont;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    
                    let maxTextWidth = 0;
                    if (socialHandle.trim() !== '') {
                      maxTextWidth = Math.max(maxTextWidth, ctx.measureText(socialHandle).width);
                    }
                    if (generatorName.trim() !== '') {
                      maxTextWidth = Math.max(maxTextWidth, ctx.measureText(generatorName).width);
                    }

                    const elements: { icon: HTMLImageElement; text: string }[] = [];
                    if (socialHandle.trim() !== '' && instaIcon && pinterIcon) {
                        elements.push({ icon: instaIcon, text: socialHandle });
                        elements.push({ icon: pinterIcon, text: socialHandle });
                    }
                    if (generatorName.trim() !== '' && genIcon) {
                        elements.push({ icon: genIcon, text: generatorName });
                    }

                    if (elements.length > 0) {
                      const bgPadding = padding * 0.5;
                      const bgX = padding - bgPadding;
                      const bgY = padding - bgPadding;
                      const bgWidth = iconSize + textPadding + maxTextWidth + (bgPadding * 2);
                      
                      const lastElementYPos = padding + (elements.length - 1) * (iconSize + textPadding * 2);
                      const bgHeight = (lastElementYPos + iconSize) - padding + (bgPadding * 2);
                      
                      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                      ctx.shadowColor = 'transparent';
                      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

                      ctx.fillStyle = 'white';
                      elements.forEach((el, index) => {
                          const yPos = padding + index * (iconSize + textPadding * 2);
                          ctx.drawImage(el.icon, padding, yPos, iconSize, iconSize);
                          ctx.fillText(el.text, padding + iconSize + textPadding, yPos + iconSize / 2);
                      });
                    }
                  }

                  // --- Draw Prompt Overlay ---
                  // Dynamic styling based on aspect ratio
                  let promptTitleSize, promptBodySize;

                  switch (ratio) {
                    case '16:9':
                      promptTitleSize = canvas.width * 0.045;
                      promptBodySize = canvas.width * 0.018;
                      break;
                    case '4:3':
                    case '5:4':
                      promptTitleSize = canvas.width * 0.06;
                      promptBodySize = canvas.width * 0.025;
                      break;
                    case '1:1':
                      promptTitleSize = canvas.width * 0.08;
                      promptBodySize = canvas.width * 0.03;
                      break;
                    case '9:16':
                    case '2:3':
                    case '3:4':
                    case '4:5':
                    default:
                      promptTitleSize = canvas.width * 0.08;
                      promptBodySize = canvas.width * 0.03;
                      break;
                  }

                  const promptPaddingX = canvas.width * 0.1;
                  const promptMaxWidth = canvas.width - (promptPaddingX * 2);

                  // Configure text styles
                  const lineHeight = promptBodySize * 1.4;
                  const promptTitleFont = `bold ${promptTitleSize}px "Inter", sans-serif`;
                  const promptBodyFont = `normal ${promptBodySize}px "Inter", sans-serif`;
                  const spacing = lineHeight * 0.8;

                  // Calculate dimensions for background
                  ctx.font = promptBodyFont;
                  const promptLines = getTextLines(ctx, prompt, promptMaxWidth);
                  const promptBodyHeight = promptLines.length * lineHeight;
                  const totalTextHeight = promptTitleSize + spacing + promptBodyHeight;
                  const backgroundPadding = promptBodySize * 1.5;
                  
                  // Position prompt box dynamically from the bottom of the canvas
                  const totalPromptBoxHeight = totalTextHeight + (backgroundPadding * 1.5);
                  const promptBottomMargin = canvas.height * 0.05; 
                  const promptBoxY = canvas.height - promptBottomMargin - totalPromptBoxHeight;
                  const promptAreaY = promptBoxY + backgroundPadding;

                  // Draw semi-transparent background for readability
                  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  ctx.fillRect(
                      promptPaddingX - backgroundPadding,
                      promptAreaY - backgroundPadding,
                      promptMaxWidth + (backgroundPadding * 2),
                      totalTextHeight + (backgroundPadding * 1.5)
                  );

                  // --- Draw Prompt Text ---
                  ctx.fillStyle = 'white';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';

                  // Shadow for readability
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                  ctx.shadowBlur = 15;
                  ctx.shadowOffsetX = 2;
                  ctx.shadowOffsetY = 2;

                  // "/prompt" text
                  ctx.font = promptTitleFont;
                  ctx.fillText('/prompt', canvas.width / 2, promptAreaY);
                  
                  // Prompt body text
                  ctx.font = promptBodyFont;
                  const promptBodyY = promptAreaY + promptTitleSize + spacing;
                  promptLines.forEach((line, index) => {
                      ctx.fillText(line, canvas.width / 2, promptBodyY + (index * lineHeight));
                  });

                  // Reset shadow
                  ctx.shadowColor = 'transparent';

                  return {
                    url: canvas.toDataURL('image/jpeg', 1.0),
                    name: `generated-${imgIndex + 1}-${ratio.replace(':', 'x')}.jpg`
                  };
                })
              );
              resolve(imagesForSource);
            } catch (err) {
              reject(err);
            }
          };
          image.onerror = () => reject(new Error("Could not load image"));
        });
      });

      const results = await Promise.all(allGeneratedImagesPromises);
      setGeneratedImages(results.flat());
      
    } catch (err) {
      console.error(err);
      setError("Hiba történt a generálás során.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceImages, prompt, socialHandle, generatorName, selectedRatios]);

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans antialiased">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">AI image prompt felirat</h1>
          <p className="text-lg text-gray-400 mt-2">Adj promptot és social linkeket a képeidhez</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="file_input">1. Képek feltöltése (max 3)</label>
                <input 
                  className="block w-full text-sm text-gray-400 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none file:bg-blue-600 file:border-none file:text-white file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-blue-700" 
                  id="file_input" 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
                 {sourceImages.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {sourceImages.map((img, idx) => (
                      <img key={idx} src={img} alt={`Uploaded preview ${idx + 1}`} className="rounded-lg h-24 w-auto object-cover border border-gray-600" />
                    ))}
                  </div>
                 )}
              </div>

              <div>
                <label htmlFor="social" className="block text-sm font-medium text-gray-300 mb-2">2. Social Media Felhasználónév (opcionális)</label>
                <input 
                  type="text" 
                  id="social" 
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  placeholder="@felhasznalo"
                />
              </div>

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">3. Prompt</label>
                <textarea 
                  id="prompt" 
                  rows={4} 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={600}
                  className="block p-2.5 w-full text-sm text-white bg-gray-700 rounded-lg border border-gray-600 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your AI prompt here..."
                ></textarea>
                <p className="text-right text-xs text-gray-400 mt-1">{prompt.length} / 600</p>
              </div>

              <div>
                <label htmlFor="generator" className="block text-sm font-medium text-gray-300 mb-2">4. Generátor neve (opcionális)</label>
                <input 
                  type="text" 
                  id="generator" 
                  value={generatorName}
                  onChange={(e) => setGeneratorName(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  placeholder="pl. Midjourney"
                />
              </div>

              <div>
                <h3 className="block text-sm font-medium text-gray-300 mb-2">5. Képarányok kiválasztása</h3>
                <div className="flex flex-wrap gap-3">
                  {ratioOrder.map(ratio => (
                    <button 
                      key={ratio} 
                      onClick={() => handleRatioChange(ratio)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${selectedRatios[ratio] ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={generateImage}
                disabled={isLoading || sourceImages.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center text-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generálás...
                  </>
                ) : 'Kép generálása'}
              </button>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-3 bg-gray-800/30 p-6 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center min-h-[400px]">
            {isLoading && (
               <div className="text-center text-gray-400">
                <p className="text-lg">Képek feldolgozása...</p>
                <p className="text-sm">Ez eltarthat egy pillanatig.</p>
              </div>
            )}
            {!isLoading && generatedImages.length === 0 && (
              <div className="text-center text-gray-500">
                <h3 className="text-xl font-semibold">Generált Képek</h3>
                <p className="mt-2">{sourceImages.length > 0 ? "Kattints a 'Kép generálása' gombra a kezdéshez." : "Tölts fel képeket a kezdéshez."}</p>
              </div>
            )}
            {generatedImages.length > 0 && (
              <div className="w-full">
                <div className="flex justify-center items-center gap-4 mb-6">
                  <h3 className="text-2xl font-bold">Eredmények ({generatedImages.length})</h3>
                  <button
                    onClick={generateImage}
                    disabled={isLoading}
                    className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <RefreshIcon />
                    Újragenerálás
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="space-y-3 group">
                      <img src={image.url} alt={`Generated ${image.name}`} className="rounded-lg shadow-2xl w-full object-contain" />
                       <a
                        href={image.url}
                        download={image.name}
                        className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform group-hover:scale-105"
                      >
                        Letöltés
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;