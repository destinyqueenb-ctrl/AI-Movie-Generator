
import React, { useState, useEffect, useCallback } from 'react';
import type { Scene } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from './Loader';

interface SceneCardProps {
  scene: Scene;
  sceneNumber: number;
  index: number;
  onUpdateScene: (updatedScene: Scene) => void;
  saveTrigger: number;
  onReorderScene: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  animationDelay: number;
}

const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
  </svg>
);

const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
  </svg>
);

const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.664 0l3.18-3.185m-3.181-4.991-3.182-3.182a8.25 8.25 0 0 0-11.664 0l-3.18 3.185" />
    </svg>
);


export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  sceneNumber,
  index,
  onUpdateScene,
  saveTrigger,
  onReorderScene,
  isFirst,
  isLast,
  animationDelay
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScene, setEditedScene] = useState<Scene>(scene);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setEditedScene(scene);
    const seed = scene.imagePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + sceneNumber;
    setImageUrl(`https://picsum.photos/seed/${seed}/800/450`);
    setIsGeneratingImage(false);
    setImageError(null);
  }, [scene, sceneNumber]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedScene(prev => ({ ...prev, [name]: value }));
  };
  
  const triggerImageGeneration = useCallback(async (prompt: string) => {
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const base64Data = await generateImage(prompt);
      setImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (error) {
      setImageError('Oops! The image could not be generated.');
      console.error(error);
      // Keep placeholder if generation fails
      const seed = scene.imagePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + sceneNumber;
      setImageUrl(`https://picsum.photos/seed/${seed}/800/450`);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [scene.imagePrompt, sceneNumber]);

  const handleSave = useCallback(async () => {
    if (editedScene.imagePrompt !== scene.imagePrompt || imageUrl.startsWith('https://picsum.photos')) {
      await triggerImageGeneration(editedScene.imagePrompt);
    }
    onUpdateScene(editedScene);
    setIsEditing(false);
  }, [editedScene, onUpdateScene, scene.imagePrompt, imageUrl, triggerImageGeneration]);

  const handleCancel = () => {
    setEditedScene(scene);
    setIsEditing(false);
  };
  
  const handleRetryGeneration = useCallback(() => {
    triggerImageGeneration(scene.imagePrompt);
  }, [scene.imagePrompt, triggerImageGeneration]);

  useEffect(() => {
    if (saveTrigger > 0 && isEditing) {
      handleSave();
    }
  }, [saveTrigger, isEditing, handleSave]);


  const inputStyles = "w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-gray-200";
  const buttonStyles = "px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200";
  const primaryButtonStyles = `${buttonStyles} bg-indigo-600 hover:bg-indigo-700 text-white`;
  const secondaryButtonStyles = `${buttonStyles} bg-gray-600 hover:bg-gray-500 text-gray-200`;
  const reorderButtonStyles = "p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed";

  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 flex flex-col transition-transform duration-300 ease-in-out hover:scale-[1.02] opacity-0 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="relative w-full h-48 bg-gray-900">
        {imageUrl && <img src={imageUrl} alt={scene.imagePrompt} className="w-full h-full object-cover" />}
        {isGeneratingImage && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader />
          </div>
        )}
         {imageError && !isGeneratingImage && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
            <p className="text-red-400 text-sm mb-3">{imageError}</p>
            <button
                onClick={handleRetryGeneration}
                className="bg-red-600/50 hover:bg-red-500/50 text-white text-xs font-semibold py-1 px-3 rounded-md flex items-center gap-1 transition-colors duration-200"
            >
                <RefreshIcon className="w-4 h-4" />
                Retry
            </button>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 text-white font-bold px-3 py-1 rounded-full text-sm">
          SCENE {sceneNumber}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        {isEditing ? (
          <input
            type="text"
            name="title"
            value={editedScene.title}
            onChange={handleInputChange}
            className={`${inputStyles} mb-2 text-xl font-bold`}
            aria-label="Scene Title"
          />
        ) : (
          <h3 className="text-xl font-bold text-white mb-2">{scene.title}</h3>
        )}

        {isEditing ? (
          <textarea
            name="description"
            value={editedScene.description}
            onChange={handleInputChange}
            className={`${inputStyles} mb-4 flex-grow text-sm min-h-[80px]`}
            rows={4}
            aria-label="Scene Description"
          />
        ) : (
          <p className="text-gray-400 text-sm mb-4 flex-grow">
            {scene.description}
          </p>
        )}
        
        <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 block">IMAGE PROMPT</label>
            {isEditing ? (
                <textarea
                name="imagePrompt"
                value={editedScene.imagePrompt}
                onChange={handleInputChange}
                className={`${inputStyles} font-mono text-xs`}
                rows={3}
                aria-label="Image Prompt"
                />
            ) : (
                <p className="text-gray-500 font-mono text-xs p-2 bg-gray-900/50 rounded-md">
                    {scene.imagePrompt}
                </p>
            )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          {isEditing ? (
             <textarea
              name="dialogue"
              value={editedScene.dialogue}
              onChange={handleInputChange}
              className={`${inputStyles} italic font-mono text-sm min-h-[60px]`}
              rows={3}
              aria-label="Scene Dialogue"
            />
          ) : (
             <p className="text-gray-300 italic font-mono text-sm bg-gray-900/50 p-3 rounded-md">"{scene.dialogue}"</p>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div>
            {!isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => onReorderScene(index, 'up')}
                  disabled={isFirst}
                  className={reorderButtonStyles}
                  aria-label="Move scene up"
                >
                  <ArrowUpIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onReorderScene(index, 'down')}
                  disabled={isLast}
                  className={reorderButtonStyles}
                  aria-label="Move scene down"
                >
                  <ArrowDownIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSave} className={primaryButtonStyles} disabled={isGeneratingImage}>
                  {isGeneratingImage ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel} className={secondaryButtonStyles} disabled={isGeneratingImage}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className={secondaryButtonStyles}>Edit Scene</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
