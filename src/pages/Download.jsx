import { useState, useEffect } from 'react';
import { Download as DownloadIcon, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';

const Download = () => {
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Configuration
  const GITHUB_REPO = 'gauciv/triji-app'; // Update this to your actual repo
  const APK_URL = import.meta.env.VITE_APK_URL || 'https://github.com/gauciv/triji-app/releases/download/v1.3.1/triji-app-v1-3-1.apk'; // Can be local path or full URL
  const MAX_RETRIES = 3;
  const FETCH_TIMEOUT = 10000; // 10 seconds

  useEffect(() => {
    fetchReleaseInfo();
  }, [retryCount]);

  const fetchReleaseInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Validate response data
        if (data && typeof data === 'object') {
          setReleaseInfo({
            version: sanitizeVersion(data.tag_name),
            notes: parseReleaseNotes(data.body),
            publishedAt: data.published_at,
          });
        } else {
          throw new Error('Invalid response format');
        }
      } else if (response.status === 404) {
        setError('no-releases');
      } else if (response.status === 403) {
        setError('rate-limit');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching release info:', err);

      if (err.name === 'AbortError') {
        setError('timeout');
      } else if (!navigator.onLine) {
        setError('offline');
      } else {
        setError('fetch-failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const sanitizeVersion = (version) => {
    if (!version || typeof version !== 'string') return 'Latest Version';
    // Remove potentially harmful characters, keep alphanumeric, dots, and hyphens
    return version.replace(/[^a-zA-Z0-9.-]/g, '').substring(0, 20);
  };

  const parseReleaseNotes = (body) => {
    if (!body || typeof body !== 'string') return [];
    
    try {
      // Limit body length to prevent DoS
      const truncatedBody = body.substring(0, 5000);
      
      // Split by lines and filter
      const lines = truncatedBody.split('\n').filter(line => line.trim());
      const notes = [];
      
      lines.forEach(line => {
        // Skip if we already have enough notes
        if (notes.length >= 10) return;
        
        let cleaned = line.trim();
        
        // Skip headers (lines starting with #)
        if (cleaned.startsWith('#')) return;
        
        // Skip links that are on their own line (like [1.4.1](https://...))
        if (cleaned.match(/^\[.*?\]\(http.*?\)$/)) return;
        
        // Remove markdown list markers (-, *, +, numbers)
        cleaned = cleaned.replace(/^[\s-*+]+/, '').replace(/^\d+\.\s*/, '').trim();
        
        // Remove standalone emoji/unicode characters at the start
        cleaned = cleaned.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '').trim();
        
        // Remove URLs in markdown format [text](url)
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        // Remove plain URLs
        cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, '');
        
        // Remove code blocks and inline code
        cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
        cleaned = cleaned.replace(/`[^`]*`/g, '');
        
        // Remove HTML tags for XSS prevention
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        
        // Remove extra parentheses that might be left from link removal
        cleaned = cleaned.replace(/\(\s*\)/g, '').trim();
        
        // Remove dates in parentheses like (2025-11-14)
        cleaned = cleaned.replace(/\(\d{4}-\d{2}-\d{2}\)/g, '').trim();
        
        // Only add if it's meaningful content
        if (cleaned && cleaned.length > 3 && cleaned.length < 200 && !cleaned.match(/^https?:/)) {
          notes.push(cleaned);
        }
      });
      
      return notes;
    } catch (err) {
      console.error('Error parsing release notes:', err);
      return [];
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      // Check if it's an external URL (S3, GitHub, etc.)
      const isExternalUrl = APK_URL.startsWith('http://') || APK_URL.startsWith('https://');
      
      if (isExternalUrl) {
        // For external URLs, check if accessible then redirect
        try {
          const checkResponse = await fetch(APK_URL, { method: 'HEAD' });
          if (!checkResponse.ok) {
            setError('apk-not-found');
            setDownloading(false);
            return;
          }
        } catch (err) {
          // If HEAD request fails, try direct download anyway
          console.warn('HEAD check failed, attempting direct download');
        }
        
        // Direct browser download for external URLs
        window.location.href = APK_URL;
        
        setTimeout(() => setDownloading(false), 2000);
      } else {
        // For local files, check existence
        const checkResponse = await fetch(APK_URL, { method: 'HEAD' });
        
        if (!checkResponse.ok) {
          setError('apk-not-found');
          setDownloading(false);
          return;
        }

        // Create a secure download link for local files
        const link = document.createElement('a');
        link.href = APK_URL;
        link.download = 'triji-app.apk';
        link.rel = 'noopener noreferrer';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          setDownloading(false);
        }, 100);
      }
      
    } catch (err) {
      console.error('Download error:', err);
      setError('download-failed');
      setDownloading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
    }
  };

  const getErrorMessage = () => {
    switch (error) {
      case 'no-releases':
        return 'No releases found. Check back soon!';
      case 'rate-limit':
        return 'Too many requests. Please try again later.';
      case 'timeout':
        return 'Request timed out. Check your connection.';
      case 'offline':
        return 'No internet connection.';
      case 'apk-not-found':
        return 'APK file not found. Please contact support.';
      case 'download-failed':
        return 'Download failed. Please try again.';
      default:
        return 'Failed to load release information.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      {/* Main Content */}
      <div className="w-full max-w-md px-2">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-green-400 to-primary bg-clip-text text-transparent">
            Triji App
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary">
            Your all-in-one mobile companion
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-dark-600 border border-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-primary/5">
          {loading ? (
            <div className="py-6 sm:py-8 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-3"></div>
              <p className="text-secondary text-xs sm:text-sm">Loading release info...</p>
            </div>
          ) : error ? (
            <div className="py-6 sm:py-8 text-center">
              {error === 'offline' ? (
                <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 mx-auto mb-2 sm:mb-3" />
              ) : (
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 mx-auto mb-2 sm:mb-3" />
              )}
              <p className="text-secondary text-xs sm:text-sm mb-3 sm:mb-4 px-2">{getErrorMessage()}</p>
              
              {/* Show download button even if release info fails */}
              {error !== 'apk-not-found' && error !== 'download-failed' && (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-dark-900 font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    {downloading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <DownloadIcon size={20} className="sm:w-6 sm:h-6" />
                        <span>Download Anyway</span>
                      </>
                    )}
                  </button>
                </>
              )}
              
              {/* Retry button for network errors */}
              {(error === 'timeout' || error === 'fetch-failed' || error === 'offline') && retryCount < MAX_RETRIES && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 text-xs sm:text-sm mx-auto"
                >
                  <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                  <span>Retry Loading Info</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Version Info */}
              {releaseInfo && (
                <div className="text-center mb-4 sm:mb-6">
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs sm:text-sm font-medium">
                    {releaseInfo.version}
                  </span>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-dark-900 font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed mb-4 sm:mb-6"
                aria-label="Download Triji App for Android"
              >
                {downloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Downloading...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon size={20} className="sm:w-6 sm:h-6" />
                    <span>Download for Android</span>
                  </>
                )}
              </button>

              {/* Release Notes */}
              {releaseInfo?.notes && releaseInfo.notes.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold mb-2 sm:mb-3 text-primary text-xs sm:text-sm">What's New:</h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {releaseInfo.notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-secondary text-xs sm:text-sm leading-relaxed">
                        <span className="text-primary mt-0.5 sm:mt-1 flex-shrink-0" aria-hidden="true">•</span>
                        <span className="break-words">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Installation Note */}
              <div className="p-2.5 sm:p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={14} />
                  <p className="text-[10px] sm:text-xs text-secondary leading-snug">
                    Enable "Install from Unknown Sources" in your Android settings to install
                  </p>
                </div>
              </div>

              {/* iOS Notice */}
              <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={14} />
                  <p className="text-[10px] sm:text-xs text-secondary leading-snug">
                    <span className="font-medium text-blue-400">iOS users:</span> Currently not supported on iOS devices. Android only.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-secondary text-[10px] sm:text-xs">
            © {new Date().getFullYear()} Triji App. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Download;
