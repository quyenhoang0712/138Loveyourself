import { selfHelpBooks } from '../books'
import { bookTranslations, languageOptions } from '../i18n'
import {
  ambientSoundOptions,
  heroVideoUrl,
  iceCubeSeconds,
  iceStackLayout,
  maxIceCubes,
  shareTextColors,
} from '../config/appConfig'
import { AmbientVisualEffect } from './AmbientVisualEffect'
import { ShareSheet, Toast } from './ShareSheet'
import { SiteHeader } from './SiteHeader'
import { AmbientSection } from '../sections/AmbientSection'
import { BookLibrarySection } from '../sections/BookLibrarySection'
import { DecisionSection } from '../sections/DecisionSection'
import { EndingSection } from '../sections/EndingSection'
import { FocusSection } from '../sections/FocusSection'
import { HeroSection } from '../sections/HeroSection'
import { PlaylistSection } from '../sections/PlaylistSection'
import { QuoteSection } from '../sections/QuoteSection'
import { SiteFooter } from '../sections/SiteFooter'

export function AppLayout({ state }) {
  const {
    activeAmbientSound,
    activeBookId,
    activeShareFrame,
    activeShareFrameId,
    activeTimerMessage,
    allShareFrames,
    bookAnimationKey,
    canAddIceCube,
    copy,
    customFrameInputRef,
    decisionAnimationKey,
    decisionMessage,
    decisionMotion,
    draggingIcePosition,
    focusRound,
    handleAddCustomFrame,
    handleAmbientSoundToggle,
    handleAskDecision,
    handleChooseAgain,
    handleCopyShareQuote,
    handleDownloadShareImage,
    handleIceCubeCountChange,
    handleIceDragEnd,
    handleIceDragStart,
    handleInterfaceClick,
    handleLanguageChange,
    handleNativeShareQuote,
    handleOpenLetter,
    handleResetTimer,
    handleSelectBook,
    handleSelectShareFrame,
    handleShareInstagramStory,
    handleShareQuote,
    handleSkipBreak,
    handleStartBreak,
    handleTimerStartToggle,
    handleToggleColorMode,
    handleToggleSaveQuote,
    iceCubeCount,
    iceCupRef,
    iceDropAnimationKey,
    iceDropDepth,
    iceFadeProgress,
    iceImpactBottom,
    iceMeltProgress,
    iceShrinkProgress,
    iceWaterProgress,
    iceWaterSurface,
    isIceDroppingIntoCup,
    isLanguageMenuOpen,
    isNightMode,
    isQuoteSaved,
    isShareSheetOpen,
    isTimerRunning,
    language,
    languageSwitcherRef,
    localizedActiveBook,
    maxSelectableIceCubes,
    openedLetter,
    openedLetterId,
    quote,
    quoteLetters,
    secondsLeft,
    setDraggingIcePosition,
    setIsLanguageMenuOpen,
    setIsShareSheetOpen,
    setShareTextColor,
    shareQuoteFontSize,
    shareTextColor,
    toastMessage,
    timerPhase,
  } = state

  return (
    <main
      className={`landing-page ${isNightMode ? 'is-night-mode' : 'is-day-mode'} ${
        activeAmbientSound ? `has-ambient-${activeAmbientSound}` : ''
      } ${draggingIcePosition && !draggingIcePosition.isDropping && !draggingIcePosition.isReturning ? 'is-dragging-ice' : ''}`}
      onClickCapture={handleInterfaceClick}
    >
      <AmbientVisualEffect activeSound={activeAmbientSound} />

      <SiteHeader
        copy={copy}
        isLanguageMenuOpen={isLanguageMenuOpen}
        isNightMode={isNightMode}
        language={language}
        languageOptions={languageOptions}
        languageSwitcherRef={languageSwitcherRef}
        onLanguageChange={handleLanguageChange}
        onLanguageMenuToggle={() => setIsLanguageMenuOpen((current) => !current)}
        onToggleColorMode={handleToggleColorMode}
      />

      <HeroSection copy={copy} videoUrl={heroVideoUrl} />

      <QuoteSection
        copy={copy}
        isQuoteSaved={isQuoteSaved}
        onOpenLetter={handleOpenLetter}
        onShareQuote={handleShareQuote}
        onToggleSaveQuote={handleToggleSaveQuote}
        openedLetter={openedLetter}
        openedLetterId={openedLetterId}
        quote={quote}
        quoteLetters={quoteLetters}
      />

      <DecisionSection
        copy={copy}
        decisionAnimationKey={decisionAnimationKey}
        decisionMessage={decisionMessage}
        decisionMotion={decisionMotion}
        onAskDecision={handleAskDecision}
        onChooseAgain={handleChooseAgain}
      />

      <AmbientSection
        activeAmbientSound={activeAmbientSound}
        copy={copy}
        onAmbientSoundToggle={handleAmbientSoundToggle}
        soundOptions={ambientSoundOptions}
      />

      <BookLibrarySection
        activeBookId={activeBookId}
        bookAnimationKey={bookAnimationKey}
        bookTranslations={bookTranslations}
        copy={copy}
        language={language}
        localizedActiveBook={localizedActiveBook}
        onSelectBook={handleSelectBook}
        selfHelpBooks={selfHelpBooks}
      />

      <PlaylistSection copy={copy} />

      <FocusSection
        activeTimerMessage={activeTimerMessage}
        canAddIceCube={canAddIceCube}
        copy={copy}
        draggingIcePosition={draggingIcePosition}
        focusRound={focusRound}
        iceCubeCount={iceCubeCount}
        iceCubeSeconds={iceCubeSeconds}
        iceCupRef={iceCupRef}
        iceDropAnimationKey={iceDropAnimationKey}
        iceDropDepth={iceDropDepth}
        iceFadeProgress={iceFadeProgress}
        iceImpactBottom={iceImpactBottom}
        iceMeltProgress={iceMeltProgress}
        iceShrinkProgress={iceShrinkProgress}
        iceStackLayout={iceStackLayout}
        iceWaterProgress={iceWaterProgress}
        iceWaterSurface={iceWaterSurface}
        isIceDroppingIntoCup={isIceDroppingIntoCup}
        isTimerRunning={isTimerRunning}
        maxIceCubes={maxIceCubes}
        maxSelectableIceCubes={maxSelectableIceCubes}
        onIceCubeCountChange={handleIceCubeCountChange}
        onIceDragCancel={() => setDraggingIcePosition(null)}
        onIceDragEnd={handleIceDragEnd}
        onIceDragStart={handleIceDragStart}
        onResetTimer={handleResetTimer}
        onSkipBreak={handleSkipBreak}
        onStartBreak={handleStartBreak}
        onTimerStartToggle={handleTimerStartToggle}
        secondsLeft={secondsLeft}
        timerPhase={timerPhase}
      />

      <EndingSection copy={copy} />
      <SiteFooter copy={copy} />

      <ShareSheet
        activeShareFrame={activeShareFrame}
        activeShareFrameId={activeShareFrameId}
        allShareFrames={allShareFrames}
        copy={copy}
        customFrameInputRef={customFrameInputRef}
        isOpen={isShareSheetOpen}
        onAddCustomFrame={handleAddCustomFrame}
        onClose={() => setIsShareSheetOpen(false)}
        onCopyShareQuote={handleCopyShareQuote}
        onDownloadShareImage={handleDownloadShareImage}
        onNativeShareQuote={handleNativeShareQuote}
        onSelectShareFrame={handleSelectShareFrame}
        onShareInstagramStory={handleShareInstagramStory}
        onTextColorChange={setShareTextColor}
        quote={quote}
        shareQuoteFontSize={shareQuoteFontSize}
        shareTextColor={shareTextColor}
        shareTextColors={shareTextColors}
      />

      <Toast message={toastMessage} />
    </main>
  )
}
