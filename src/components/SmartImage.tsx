import React, { useState, useRef, useEffect } from 'react';

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  priority?: boolean;
  fallbackSrc?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src = '',
  alt,
  priority = false,
  fallbackSrc = '',
  className = '',
  containerClassName = '',
  showSkeleton = true,
  onLoad,
  onError,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync src prop changes
  useEffect(() => {
    setImgSrc(src || '');
    setHasError(false);
    if (!src) {
      setIsLoaded(false);
      return;
    }
    // If the image is already cached in browser memory, mark loaded immediately
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  if (!imgSrc && !fallbackSrc) {
    return null;
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
    if (onError) onError(e);
  };

  if (hasError && !fallbackSrc) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Instant Skeleton Placeholder */}
      {showSkeleton && !isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-amber-100/60 via-amber-200/40 to-amber-100/60 animate-pulse z-1 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Optimized Image */}
      <img
        ref={imgRef}
        src={imgSrc || fallbackSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-none`}
        {...rest}
      />
    </div>
  );
};
