
// FIX: Imported useState and useCallback from React to resolve hook-related errors.
import React, { useState, useCallback } from 'react';
import { generateMovieScript } from './services/geminiService';
import type { MovieScript, Scene } from './types';
import { SceneCard } from './components/SceneCard';
import { Loader } from './components/Loader';

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [movieScript, setMovieScript] = useState<MovieScript | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTrigger, setSaveTrigger] = useState(0);

  const handleGenerateScript = useCallback(async () => {
    if (!idea.trim()) {
      setError('Please enter a movie idea.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMovieScript(null);

    try {
      const script = await generateMovieScript(idea);
      // Add unique IDs to scenes for stable keys during reordering
      const scenesWithIds = script.scenes.map(scene => ({
        ...scene,
        id: self.crypto.randomUUID(),
      }));
      setMovieScript({ ...script, scenes: scenesWithIds });
    } catch (err) {
      setError('Failed to generate script. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [idea]);

  const handleUpdateScene = useCallback((index: number, updatedScene: Scene) => {
    setMovieScript(currentScript => {
      if (!currentScript) return null;

      const newScenes = [...currentScript.scenes];
      newScenes[index] = updatedScene;

      return {
        ...currentScript,
        scenes: newScenes,
      };
    });
  }, []);

  const handleReorderScene = useCallback((index: number, direction: 'up' | 'down') => {
    setMovieScript(currentScript => {
      if (!currentScript) return null;

      const scenes = [...currentScript.scenes];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= scenes.length) {
        return currentScript; // Out of bounds, do nothing
      }

      // Swap the scenes
      [scenes[index], scenes[targetIndex]] = [scenes[targetIndex], scenes[index]];

      return {
        ...currentScript,
        scenes,
      };
    });
  }, []);

  const handleSaveAll = () => {
    setSaveTrigger(c => c + 1);
  };

  const FilmIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-15Zm-1.5 3a1.5 1.5 0 0 1 1.5-1.5h1.5v12H4.5A1.5 1.5 0 0 1 3 16.5v-9Zm16.5 0a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H18v-12h1.5Zm-12-1.5h9v12h-9v-12Z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FilmIcon className="w-12 h-12 text-indigo-400"/>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
              AI Movie Script Generator
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Turn your spark of an idea into a structured movie storyboard. Describe your concept and let AI build the narrative.
          </p>
        </header>

        <main>
          <div className="max-w-3xl mx-auto bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              <label htmlFor="movie-idea" className="text-lg font-semibold text-gray-300">
                Enter Your Movie Idea
              </label>
              <textarea
                id="movie-idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., In near-future Addis Ababa, a reclusive audio engineer discovers a mysterious signal broadcast from the Entoto mountains, a signal that seems to rewrite memories."
                className="w-full p-4 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 min-h-[120px] text-gray-200 placeholder-gray-500"
              />
              <button
                onClick={handleGenerateScript}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-indigo-500/30 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader />
                    Generating...
                  </>
                ) : (
                  'Generate Script'
                )}
              </button>
            </div>
          </div>
          
          {error && <p className="text-center text-red-400 mt-6">{error}</p>}

          <div className="mt-12">
            {isLoading && !movieScript && (
               <div className="text-center text-gray-400">
                  <p className="text-xl">Crafting your story...</p>
                  <p>This can take a moment as the AI builds the world, characters, and plot.</p>
               </div>
            )}
            {movieScript && (
              <div>
                <section className="text-center mb-6 p-6 bg-gray-800/30 rounded-xl">
                  <h2 className="text-4xl font-extrabold text-white">{movieScript.title}</h2>
                  <p className="text-xl text-indigo-300 mt-2 font-medium">{movieScript.genre}</p>
                </section>

                <div className="text-center mb-8">
                  <button
                    onClick={handleSaveAll}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-green-500/30 shadow-lg mx-auto"
                  >
                    Save All Edits
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {movieScript.scenes.map((scene, index) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      sceneNumber={index + 1}
                      index={index}
                      onUpdateScene={(updatedScene) => handleUpdateScene(index, updatedScene)}
                      saveTrigger={saveTrigger}
                      onReorderScene={handleReorderScene}
                      isFirst={index === 0}
                      isLast={index === movieScript.scenes.length - 1}
                      animationDelay={index * 150}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;