import React, { useState } from "react";

// Vinok Form Builder + Live Preview
// Single-file React component using TailwindCSS.
// - Default export: FormBuilderPreview
// - No external libs required
// - Usage: drop into your React app and render <FormBuilderPreview />

export default function App() {
  const [meta, setMeta] = useState({
    title: "",
    description: "",
    vinoks: "",
    image: null,
  });

  const blankOption = () => ({
    id: Date.now() + Math.random(),
    title: "",
    description: "",
    image: null,
    checked: false,
  });

  const blankStep = (type = "CHECKBOX") => ({
    id: Date.now() + Math.random(),
    type,
    question: "",
    options: [blankOption(), blankOption(), blankOption(), blankOption()],
    stars: 5,
    maxScore: 7,
  });

  const [steps, setSteps] = useState([
    blankStep("CHECKBOX"),
    blankStep("ORDERING"), 
    blankStep("SCORE"),
    blankStep("TEXT")
  ]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [showFinalPreview, setShowFinalPreview] = useState(false);

  // --- Meta handlers ---
  function handleMetaChange(k, v) {
    setMeta((prev) => ({ ...prev, [k]: v }));
  }

  function handleMetaImage(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMeta((prev) => ({ ...prev, image: { file, url } }));
  }

  // --- Steps handlers ---
  function updateStep(idx, patch) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function addStep() {
    if (steps.length >= 4) return;
    setSteps((prev) => [...prev, blankStep()]);
    setActiveStepIdx(steps.length);
  }

  function removeStep(idx) {
    const next = steps.filter((_, i) => i !== idx);
    setSteps(next);
    setActiveStepIdx(Math.max(0, Math.min(next.length - 1, idx - 1)));
  }

  function setStepType(idx, type) {
    const base = { type, question: "" };
    if (type === "CHECKBOX" || type === "ORDERING")
      base.options = [
        blankOption(),
        blankOption(),
        blankOption(),
        blankOption(),
      ];
    if (type === "SCORE") base.maxScore = 7;
    if (type === "TEXT") base.stars = 5;
    updateStep(idx, base);
  }

  // Option handlers
  function updateOption(stepIdx, optId, patch) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIdx) return s;
        return {
          ...s,
          options: s.options.map((o) =>
            o.id === optId ? { ...o, ...patch } : o,
          ),
        };
      }),
    );
  }

  function addOption(stepIdx) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx ? { ...s, options: [...s.options, blankOption()] } : s,
      ),
    );
  }

  function removeOption(stepIdx, optId) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? { ...s, options: s.options.filter((o) => o.id !== optId) }
          : s,
      ),
    );
  }

  function moveOption(stepIdx, optId, direction) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIdx) return s;
        const idx = s.options.findIndex((o) => o.id === optId);
        if (idx === -1) return s;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= s.options.length) return s;
        const arr = [...s.options];
        const [item] = arr.splice(idx, 1);
        arr.splice(newIdx, 0, item);
        return { ...s, options: arr };
      }),
    );
  }

  function handleOptionImage(stepIdx, optId, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateOption(stepIdx, optId, { image: { file, url } });
  }

  // Export JSON and Images as ZIP
  async function exportJSON() {
    // Dynamic import of JSZip
    const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
    const zip = new JSZip();
    
    // Create the JSON data
    const data = {
      meta: {
        title: meta.title,
        description: meta.description,
        vinoks: meta.vinoks,
        image: meta.image ? meta.image.file.name : null,
      },
      steps: steps.map((s) => ({
        questionType: s.type,
        question: s.question,
        options: s.options
          ? s.options.map((o) => ({
              title: o.title,
              description: o.description,
              image: o.image ? o.image.file.name : null,
            }))
          : undefined,
      })),
    };

    // Add JSON file to zip
    zip.file("survey.json", JSON.stringify(data, null, 2));
    
    // Create images folder and add all images
    const imagesFolder = zip.folder("images");
    
    // Add meta image if exists
    if (meta.image?.file) {
      imagesFolder.file(meta.image.file.name, meta.image.file);
    }
    
    // Add option images if exist
    for (const step of steps) {
      if (step.options) {
        for (const option of step.options) {
          if (option.image?.file) {
            imagesFolder.file(option.image.file.name, option.image.file);
          }
        }
      }
    }

    try {
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Download the ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.title || "survey"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      alert("Error al crear el archivo ZIP. Inténtalo de nuevo.");
    }
  }

  // --- Render ---
  return (
    <div className="flex gap-6 p-6 font-sans">
      <div className="w-2/5 bg-white rounded-2xl shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold">Datos de la encuesta</h2>
        <label className="block">
          <span className="text-sm">Título</span>
          <input
            value={meta.title}
            onChange={(e) => handleMetaChange("title", e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
            placeholder="Título de la encuesta"
          />
        </label>
        <label className="block">
          <span className="text-sm">Descripción</span>
          <textarea
            value={meta.description}
            onChange={(e) => handleMetaChange("description", e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
            placeholder="Descripción corta"
          />
        </label>
        <label className="block">
          <span className="text-sm">Vinoks a recibir</span>
          <input
            value={meta.vinoks}
            onChange={(e) => handleMetaChange("vinoks", e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
            placeholder="Ingresa los vinoks"
          />
        </label>
        <label className="block">
          <span className="text-sm">Imagen de la encuesta</span>
          <div className="mt-1">
            <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra una imagen
                </p>
                <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleMetaImage(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
          {meta.image && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={meta.image.url}
                alt="preview"
                className="rounded h-28 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (meta.image?.url) URL.revokeObjectURL(meta.image.url);
                  setMeta((prev) => ({ ...prev, image: null }));
                }}
                className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs"
              >
                Eliminar
              </button>
            </div>
          )}
        </label>

        <div className="pt-4">
          <h3 className="font-medium">Pasos (máx 4)</h3>
          <div className="flex gap-2 mt-2">
            {steps.map((s, i) => (
              <button
                key={s.id}
                className={`px-3 py-1 rounded ${i === activeStepIdx ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                onClick={() => setActiveStepIdx(i)}
              >
                Paso {i + 1}
              </button>
            ))}
            <button
              onClick={addStep}
              disabled={steps.length >= 4}
              className="ml-auto px-3 py-1 rounded bg-green-500 text-white"
            >
              + Añadir
            </button>
          </div>
        </div>

        {/* Active step editor */}
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium">Editar Paso {activeStepIdx + 1}</h3>
          {steps[activeStepIdx] && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm">Tipo</span>
                <select
                  value={steps[activeStepIdx].type}
                  onChange={(e) => setStepType(activeStepIdx, e.target.value)}
                  className="mt-1 w-full rounded-md border p-2"
                >
                  <option value="CHECKBOX">
                    Checkbox — Selección múltiple con tarjetas
                  </option>
                  <option value="ORDERING">
                    Ordering — Ordenar opciones
                  </option>
                  <option value="TEXT">
                    Text — Valoración con estrellas y texto
                  </option>
                  <option value="SCORE">
                    Score — Puntuación numérica
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm">Pregunta</span>
                <input
                  value={steps[activeStepIdx].question}
                  onChange={(e) =>
                    updateStep(activeStepIdx, { question: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border p-2"
                />
              </label>

              {(steps[activeStepIdx].type === "CHECKBOX" ||
                steps[activeStepIdx].type === "ORDERING") && (
                <div>
                  <span className="text-sm">Opciones</span>
                  <div className="space-y-2 mt-2">
                    {steps[activeStepIdx].options.map((opt) => (
                      <div
                        key={opt.id}
                        className="border rounded p-2 flex gap-3 items-start"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {opt.image ? (
                            <img
                              src={opt.image.url}
                              alt="opt"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              Imagen
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            value={opt.title}
                            onChange={(e) =>
                              updateOption(activeStepIdx, opt.id, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Título"
                            className="w-full rounded-md border p-1"
                          />
                          <input
                            value={opt.description}
                            onChange={(e) =>
                              updateOption(activeStepIdx, opt.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Descripción"
                            className="w-full rounded-md border p-1 mt-1"
                          />
                          <div className="flex gap-2 mt-2">
                            <div className="flex-1">
                              <label className="flex items-center justify-center px-3 py-1 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-xs">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {opt.image ? 'Cambiar' : 'Imagen'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleOptionImage(
                                      activeStepIdx,
                                      opt.id,
                                      e.target.files?.[0],
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <button
                              onClick={() =>
                                moveOption(activeStepIdx, opt.id, -1)
                              }
                              className="px-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() =>
                                moveOption(activeStepIdx, opt.id, +1)
                              }
                              className="px-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() =>
                                removeOption(activeStepIdx, opt.id)
                              }
                              className="px-2 rounded bg-red-200 hover:bg-red-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addOption(activeStepIdx)}
                        className="px-3 py-1 rounded bg-blue-500 text-white"
                      >
                        + Opción
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {steps[activeStepIdx].type === "SCORE" && (
                <div>
                  <span className="text-sm">Configuración de puntuación</span>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm">Máximo</label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      disabled
                      value={steps[activeStepIdx].maxScore}
                      onChange={(e) =>
                        updateStep(activeStepIdx, {
                          maxScore: Number(e.target.value),
                        })
                      }
                      className="w-20 rounded border p-1"
                    />
                  </div>
                </div>
              )}

              {steps[activeStepIdx].type === "TEXT" && (
                <div>
                  <span className="text-sm">Número de estrellas</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    disabled
                    value={steps[activeStepIdx].stars}
                    onChange={(e) =>
                      updateStep(activeStepIdx, {
                        stars: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-24 rounded border p-1"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => removeStep(activeStepIdx)}
                  className="px-3 py-1 rounded bg-red-500 text-white"
                >
                  Eliminar paso
                </button>
                <button
                  onClick={() => setShowFinalPreview((p) => !p)}
                  className="px-3 py-1 rounded bg-indigo-500 text-white ml-auto"
                >
                  {showFinalPreview ? "Volver a editar" : "Ver preview final"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t mt-4">
          <button
            onClick={exportJSON}
            className="w-full py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            📦 Exportar ZIP (JSON + Imágenes)
          </button>
        </div>
      </div>

      <div className="w-3/5">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-3">
            Previsualización {showFinalPreview ? "(Final)" : "(En vivo)"}
          </h2>

          {/* Final preview */}
          {showFinalPreview ? (
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                {meta.image && (
                  <img
                    src={meta.image.url}
                    alt="encuesta"
                    className="w-48 h-32 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="text-2xl font-bold">
                    {meta.title || "Título de la encuesta"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {meta.description || "Descripción..."}
                  </p>
                  {meta.vinoks && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {meta.vinoks}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((s, i) => (
                  <div key={s.id} className="border rounded p-4">
                    <h4 className="font-semibold">
                      Paso {i + 1} — {s.question || "(Pregunta)"}
                    </h4>

                    {/* Render según tipo */}
                    {s.type === "CHECKBOX" && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {s.options.map((o) => (
                          <label
                            key={o.id}
                            className="border rounded p-3 flex gap-3 items-start"
                          >
                            <input type="checkbox" className="mt-1" />
                            <div>
                              <div className="font-medium">
                                {o.title || "Título"}
                              </div>
                              <div className="text-sm text-gray-600">
                                {o.description || "Descripción"}
                              </div>
                            </div>
                            {o.image && (
                              <img
                                src={o.image.url}
                                alt="opt"
                                className="w-16 h-12 object-cover ml-auto rounded"
                              />
                            )}
                          </label>
                        ))}
                      </div>
                    )}

                    {s.type === "ORDERING" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500">
                          Ordena las opciones (ejemplo)
                        </p>
                        <ol className="list-decimal ml-5 mt-2 space-y-2">
                          {s.options.map((o) => (
                            <li key={o.id} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {o.title || "Título"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {o.description || "Descripción"}
                                </div>
                              </div>
                              {o.image && (
                                <img
                                  src={o.image.url}
                                  alt="opt"
                                  className="w-16 h-12 object-cover rounded"
                                />
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {s.type === "SCORE" && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          Elige de 1 a {s.maxScore}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {Array.from({ length: s.maxScore }).map((_, idx) => (
                            <button
                              key={idx}
                              className="px-3 py-1 border rounded"
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.type === "TEXT" && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          Valora con estrellas y agrega comentarios
                        </p>
                        <div className="flex gap-2 mt-2 mb-3">
                          {Array.from({ length: s.stars }).map((_, idx) => (
                            <span key={idx} className="text-xl">
                              ★
                            </span>
                          ))}
                        </div>
                        <textarea
                          placeholder="Escribe tus comentarios aquí..."
                          className="w-full border rounded p-2 text-sm"
                          rows={3}
                          disabled
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Live mini-preview while editing
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                {meta.image && (
                  <img
                    src={meta.image.url}
                    alt="encuesta"
                    className="w-36 h-24 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {meta.title || "Título de la encuesta"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {meta.description || "Descripción..."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((s, i) => (
                  <div key={s.id} className="border rounded p-3">
                    <div className="flex justify-between">
                      <div>
                        <strong>Paso {i + 1}</strong> — {s.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {s.question || "(sin pregunta)"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
