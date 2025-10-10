import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from 'react';
import ParallaxSection from "@/components/ParallaxSection";
import Countdown from "@/components/Countdown";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "../lib/AuthContext";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from '../lib/supabaseClient';
import styles from "../components/menuZoom.module.css";
import photosStyles from '../styles/photos.module.css';
import imageZoomStyles from '../styles/imageZoom.module.css';

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || "2025-10-18T18:00:00-03:00";

const images = [
  { src: '/luna.jpeg', alt: 'Luna 1' },
  { src: '/luna.webp', alt: 'Luna 2' },
  { src: '/luna2.webp', alt: 'Luna 3' },
  { src: '/luna3.webp', alt: 'Luna 4' },
  { src: '/luna4.webp', alt: 'Luna 5' },
  { src: '/luna5.webp', alt: 'Luna 6' },
  { src: '/luna6.webp', alt: 'Luna 7' },
];

export default function Home() {
  const { token, authLoading } = useAuth();
  const [userName, setUserName] = useState('');
  const [rsvp, setRsvp] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const handleImageNavigation = useCallback((direction: 'prev' | 'next') => {
    setSelectedImage(prev => {
      if (prev === null) return null;
      if (direction === 'prev') {
        return prev === 0 ? images.length - 1 : prev - 1;
      } else {
        return prev === images.length - 1 ? 0 : prev + 1;
      }
    });
  }, []);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImage(index);
    setIsZoomed(true);
  }, []);

  const handleCloseZoom = useCallback(() => {
    setIsZoomed(false);
    setSelectedImage(null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Actualizar nombre desde localStorage
      setUserName(localStorage.getItem('name') || '');
      
      // Escuchar cambios en localStorage (por ejemplo, desde otra pestaña)
      const handler = () => setUserName(localStorage.getItem('name') || '');
      window.addEventListener('storage', handler);
      
      // Limpiar el listener cuando el componente se desmonte
      return () => window.removeEventListener('storage', handler);
    }
  }, [token]); // Solo se ejecuta cuando cambia el token

  useEffect(() => {
    async function fetchRsvp() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setRsvp(null);
        const { data } = await supabase
          .from('rsvp')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (data) setRsvp(data);
        else setRsvp(null);
      } catch {
        setRsvp(null);
      }
    }
    if (token) fetchRsvp();
  }, [token]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isZoomed) return;
      
      switch (event.key) {
        case 'Escape':
          setIsZoomed(false);
          setSelectedImage(null);
          break;
        case 'ArrowLeft':
          setSelectedImage(prev => 
            prev === null ? null : 
            prev === 0 ? images.length - 1 : prev - 1
          );
          break;
        case 'ArrowRight':
          setSelectedImage(prev => 
            prev === null ? null : 
            prev === images.length - 1 ? 0 : prev + 1
          );
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isZoomed]);

  return (
    <>
      <Head>
        <title>Sofía & Franco — Nuestra Boda</title>
        <meta name="description" content="Acompañanos a celebrar nuestro amor. Conocé los detalles y confirmá tu asistencia." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="pt-24 md:pt-28">
        <ParallaxSection bg="/hero-bg.svg">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl">Sofía & Franco</h1>
            <p className="mt-2 text-lg md:text-xl opacity-80">Buenos Aires — 18 de Octubre de 2025 · 18:00 hs</p>
            <div className="mt-6">
              <Countdown date={EVENT_DATE} />
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              {!authLoading && token ? (
                <a href="/rsvp" className="px-6 py-3 rounded-full bg-dusk text-white">
                  {rsvp && rsvp.asistencia === 'asistire' ? 'Modificar asistencia' : 'Confirmar asistencia'}
                </a>
              ) : (
                <>
                  <a href="/rsvp" className="px-6 py-3 rounded-full bg-dusk text-white">Confirmar asistencia</a>
                  <a href="/menu" className="px-6 py-3 rounded-full bg-gold text-dusk">Ver menú</a>
                </>
              )}
            </div>
            {/* Mensaje para usuario autenticado */}
            {!authLoading && token && (
              <div className="mt-4 text-green-700 text-sm">
                ¡Bienvenido{userName ? `, ${userName}` : ''}! Ya puedes {rsvp ? 'modificar' : 'confirmar'} tu asistencia.
              </div>
            )}
            {/* Mostrar resumen de RSVP si existe */}
            {!authLoading && token && rsvp && (
              <div className="mt-6 bg-white/80 rounded-xl shadow p-4 max-w-md mx-auto text-left">
                <div className="font-bold mb-2">Tu reserva:</div>
                <div><b>Asistencia:</b> {rsvp.asistencia === 'asistire' ? 'Asistiré' : 'No puedo ir'}</div>
                {rsvp.asistencia === 'asistire' && <div><b>Menú:</b> {rsvp.menu}</div>}
                {rsvp.comentario && <div><b>Comentario:</b> {rsvp.comentario}</div>}
              </div>
            )}
          </div>
        </ParallaxSection>

        <ParallaxSection bg="/texture.svg">
          <div className="space-y-3 text-center">
            <h2 className="font-display text-3xl md:text-4xl">Nuestra historia</h2>
  <p>Nos conocimos en un café de Buenos Aires en 2019, sin imaginar que ese encuentro iba a cambiarlo todo. Entre charlas, risas, mates, libros y paseos por Palermo, empezamos a construir recuerdos que hoy guardamos como tesoros. Con el tiempo llegaron viajes, proyectos, noches de películas, caminatas bajo la lluvia y abrazos que hicieron que cada día tuviera algo especial. Aprendimos que el amor también se nutre de las cosas simples: cocinar juntos, acompañarnos en los momentos difíciles, festejar cada logro y hasta discutir para después volver a elegirnos.</p>

  <p>Hoy queremos celebrar este camino que seguimos compartiendo. Y no se trata solo de nosotros, sino también de quienes siempre estuvieron cerca, alentándonos y dándonos fuerzas. Por eso, este encuentro es un gracias enorme, un festejo compartido y la oportunidad de seguir sumando historias con todos.</p>

          </div>
        </ParallaxSection>

        <section className="py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-center text-dusk mb-8">Nuestra Galería</h2>
            <div className={`${photosStyles['photos-grid']} relative`}>
              {images.map((img, index) => (
                <div
                  key={img.src}
                  className={photosStyles['photo-container']}
                  onClick={() => handleImageClick(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                </div>
              ))}
              
              {isZoomed && selectedImage !== null && (
                <div className={imageZoomStyles.zoomOverlay} onClick={handleCloseZoom}>
                  <div className={imageZoomStyles.zoomContainer} onClick={e => e.stopPropagation()}>
                    <TransformWrapper
                      initialScale={1}
                      minScale={0.5}
                      maxScale={4}
                      centerOnInit={true}
                      wheel={{ disabled: true }}
                    >
                      <TransformComponent
                        wrapperStyle={{ width: "100%", height: "100%" }}
                      >
                        <img
                          src={images[selectedImage].src}
                          alt={images[selectedImage].alt}
                          className={imageZoomStyles.zoomImage}
                        />
                      </TransformComponent>
                    </TransformWrapper>
                    <button
                      className={`${imageZoomStyles.navigationButton} ${imageZoomStyles.prevButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageNavigation('prev');
                      }}
                    >
                      ←
                    </button>
                    <button
                      className={`${imageZoomStyles.navigationButton} ${imageZoomStyles.nextButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageNavigation('next');
                      }}
                    >
                      →
                    </button>
                    <div className={imageZoomStyles.imageCounter}>
                      {selectedImage + 1} / {images.length}
                    </div>
                    <button
                      className={imageZoomStyles.closeButton}
                      onClick={handleCloseZoom}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 md:px-0">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="font-display text-2xl md:text-3xl mb-3">El lugar</h3>
              <p className="opacity-80">Salón "Luz de Luna" — Av. Libertador 2540, Buenos Aires.</p>
              <p className="opacity-80 mt-2">Ceremonia íntima, brindis y muchas pizzas caseras. ¡No faltes!</p>
            </div>
            <Map lat={-34.5711} lng={-58.4233} />
          </div>
        </section>

        <ParallaxSection bg="/texture.svg">
          <div className="text-center">
            <h3 className="font-display text-3xl">Dress code & tips</h3>
            <p className="mt-2 opacity-80">Elegante sport. Traé tu mejor sonrisa y ganas de bailar.</p>
            <div className="flex justify-center gap-4 md:gap-6 mt-6 flex-wrap">
              <div className="w-full max-w-[220px] sm:max-w-xs flex justify-center">
                <img
                  src="/mujer_elegante.avif"
                  alt="Ejemplo de vestimenta elegante sport mujer"
                  className="rounded-2xl shadow-lg w-full border border-[#C9A063] bg-white"
                  style={{height: 260, objectFit: 'contain'}} 
                  draggable={false}
                />
              </div>
              <div className="w-full max-w-[220px] sm:max-w-xs flex justify-center">
                <img
                  src="/elegante_hombre.jpg"
                  alt="Ejemplo de vestimenta elegante sport hombre"
                  className="rounded-2xl shadow-lg w-full border border-[#C9A063] bg-white"
                  style={{height: 260, objectFit: 'contain'}} 
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </ParallaxSection>
      </main>
      <Footer />
    </>
  );
}
