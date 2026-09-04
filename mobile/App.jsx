import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import * as Linking from 'expo-linking';
import { Accelerometer } from 'expo-sensors';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL
  || (Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://127.0.0.1:5001');
const defaultAssetBaseUrl = 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets';
const assetBaseUrl = String(process.env.EXPO_PUBLIC_ASSET_BASE_URL || defaultAssetBaseUrl).replace(/\/+$/, '');

function getAssetSource(pathname) {
  const cleanPathname = String(pathname || '').replace(/^\/+/, '');
  return { uri: `${assetBaseUrl}/${cleanPathname.split('/').map(encodeURIComponent).join('/')}` };
}

const appAssetSources = {
  homeBackground: getAssetSource('mobile/nenn-mobile.png'),
  mascotWithSpeaker: getAssetSource('mobile/mascot-cam-loa-mobile.png'),
  transitionMascot: getAssetSource('PNG/tay-trai-tim.png'),
  wheel: getAssetSource('Vector.gif'),
};

const toolbarItems = [
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'community', label: 'Cộng đồng', icon: 'community' },
  { id: 'diary', label: 'Nhật ký', icon: 'diary' },
  { id: 'profile', label: 'Cá nhân', icon: 'profile' },
];
const roomTransitionDuration = 2000;
const roomTransitionRouteDelay = 1000;
const roomTransitionColors = {
  home: '#4789c8',
  community: '#4789c8',
  diary: '#4789c8',
  profile: '#4789c8',
  'card-room': '#4789c8',
  'sound-room': '#4789c8',
  'focus-room': '#4789c8',
  'healing-room': '#4789c8',
};

const homeWheelLinks = [
  { id: 'card-room', label: 'phòng thiệp', style: 'card', rotation: -90 },
  { id: 'sound-room', label: 'phòng nghe nhạc', style: 'sound', rotation: 0 },
  { id: 'focus-room', label: 'phòng tập trung', style: 'focus', rotation: 90 },
  { id: 'healing-room', label: 'phòng thư giãn', style: 'healing', rotation: 180 },
];
const genderOptions = [
  { id: 'female', label: 'Nữ' },
  { id: 'male', label: 'Nam' },
  { id: 'other', label: 'Khác' },
];
const homeWavePathTop = 'M0 0H360V30C300 8 240 52 180 30S60 8 0 30Z M360 0H720V30C660 8 600 52 540 30S420 8 360 30Z';
const homeWavePathBottom = 'M0 30C60 8 120 52 180 30S300 8 360 30V60H0Z M360 30C420 8 480 52 540 30S660 8 720 30V60H360Z';

function ToolbarIcon({ type, isActive }) {
  const color = isActive ? '#ffffff' : 'rgba(71, 137, 200, 0.78)';
  const strokeStyle = { borderColor: color };
  const fillStyle = { backgroundColor: color };

  return (
    <View style={styles.icon}>
      {type === 'home' ? (
        <>
          <View style={[styles.homeRoof, strokeStyle]} />
          <View style={[styles.homeBody, strokeStyle]} />
        </>
      ) : null}

      {type === 'community' ? (
        <>
          <View style={[styles.dot, styles.dotLeft, fillStyle]} />
          <View style={[styles.dot, styles.dotRight, fillStyle]} />
          <View style={[styles.smileLine, strokeStyle]} />
        </>
      ) : null}

      {type === 'diary' ? (
        <>
          <View style={[styles.diaryPage, strokeStyle]} />
          <View style={[styles.diaryLine, fillStyle]} />
        </>
      ) : null}

      {type === 'profile' ? (
        <>
          <View style={[styles.profileHead, strokeStyle]} />
          <View style={[styles.profileIconBody, strokeStyle]} />
        </>
      ) : null}

    </View>
  );
}

function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : null;
}

function getQueryParam(url, key) {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    return '';
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function HeroBar({ activeItemId, onChangeItem }) {
  const [barWidth, setBarWidth] = useState(0);
  const indicatorTranslateValue = useRef(new Animated.Value(0)).current;
  const activeIndex = useMemo(
    () => toolbarItems.findIndex((item) => item.id === activeItemId),
    [activeItemId],
  );
  const itemWidth = `${100 / toolbarItems.length}%`;
  const indicatorWidth = barWidth > 0 ? (barWidth - 28) / toolbarItems.length : 0;

  useEffect(() => {
    if (indicatorWidth <= 0 || activeIndex < 0) return;

    Animated.spring(indicatorTranslateValue, {
      toValue: activeIndex * indicatorWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 150,
    }).start();
  }, [activeIndex, indicatorTranslateValue, indicatorWidth]);

  return (
    <View style={styles.heroBarWrap}>
      <View style={styles.heroBar} onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
        {indicatorWidth > 0 && activeIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorTranslateValue }],
              },
            ]}
          />
        ) : null}

        {toolbarItems.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={item.id}
              onPress={() => onChangeItem(item.id)}
              style={({ pressed }) => [
                styles.heroBarItem,
                { width: itemWidth },
                isActive && styles.heroBarItemActive,
                pressed && styles.heroBarItemPressed,
              ]}
            >
              <ToolbarIcon type={item.icon} isActive={isActive} />
              <Text style={[styles.heroBarLabel, isActive && styles.heroBarLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TopHeroBar({ user, onAuthPress, onIntroPress }) {
  return (
    <View style={styles.topHeroBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Giới thiệu phòng"
        onPress={onIntroPress}
        style={({ pressed }) => [styles.topHeroButton, styles.topHeroButtonLeft, pressed && styles.topHeroButtonPressed]}
      >
        <Text style={styles.topHeroButtonText} numberOfLines={1}>Giới thiệu</Text>
      </Pressable>

      <View style={styles.brand}>
        <Text style={styles.brandTitle} numberOfLines={1}>LOVE YOURSELF</Text>
        <Text style={styles.brandSubtitle} numberOfLines={1}>138knitwear</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={user ? `Phòng của ${user.name}` : 'Đăng nhập hoặc đăng ký'}
        onPress={onAuthPress}
        style={({ pressed }) => [styles.topHeroButton, styles.topHeroButtonRight, pressed && styles.topHeroButtonPressed]}
      >
        <Text style={styles.topHeroButtonText} numberOfLines={1}>{user ? user.name : 'Đăng nhập'}</Text>
      </Pressable>
    </View>
  );
}

function WaveEdge({ position }) {
  const isTop = position === 'top';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.homeWaveEdge,
        position === 'top' ? styles.homeWaveEdgeTop : styles.homeWaveEdgeBottom,
      ]}
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 720 60" width="100%">
        <Path d={isTop ? homeWavePathTop : homeWavePathBottom} fill="#fff7ec" />
      </Svg>
    </View>
  );
}

function HomeScreen({
  isAboutVisible,
  onAuthPress,
  onChangeItem,
  onCloseAbout,
  onIntroPress,
  onStickyTopBarVisibilityChange,
  user,
}) {
  const { width } = useWindowDimensions();
  const rotationValue = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(0);
  const lastShakeAtRef = useRef(0);
  const [activeWheelLinkId, setActiveWheelLinkId] = useState('sound-room');
  const wheelSize = Math.max(width * 1.9, 680);
  const lowerWheelLinkInset = Math.max(14, Math.min(width * 0.14, (width - 268) / 2));
  const wheelRotation = rotationValue.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const updateStickyTopBarVisibility = (event) => {
    onStickyTopBarVisibilityChange(event.nativeEvent.contentOffset.y > 560);
  };

  const rotateWheel = (direction) => {
    const nextRotation = rotationRef.current + direction * 90;
    rotationRef.current = nextRotation;
    const normalizedRotation = ((nextRotation % 360) + 360) % 360;
    const activeLink = homeWheelLinks.find((link) => ((link.rotation % 360) + 360) % 360 === normalizedRotation);
    if (activeLink) setActiveWheelLinkId(activeLink.id);

    Animated.timing(rotationValue, {
      toValue: nextRotation,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    let subscription;
    let isMounted = true;

    async function subscribeToShake() {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable || !isMounted) return;

      Accelerometer.setUpdateInterval(120);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt((x * x) + (y * y) + (z * z));
        const now = Date.now();

        if (acceleration < 2.25 || now - lastShakeAtRef.current < 900) return;

        lastShakeAtRef.current = now;
        rotateWheel(1);
      });
    }

    subscribeToShake();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return (
    <View style={styles.homeScreenWrap}>
      <ScrollView
        alwaysBounceVertical
        bounces
        canCancelContentTouches
        contentContainerStyle={styles.homeScrollContent}
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onScroll={updateStickyTopBarVisibility}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        style={styles.homeScreen}
      >
        <View style={styles.homeOpeningCluster}>
          <SafeAreaView style={styles.homeInlineTopSafeArea}>
            <TopHeroBar user={user} onAuthPress={onAuthPress} onIntroPress={onIntroPress} />
          </SafeAreaView>
          <View style={styles.homeIntroSection}>
            <View pointerEvents="none" style={styles.homeIntroFrame}>
              <Image
                accessibilityIgnoresInvertColors
                pointerEvents="none"
                resizeMode="contain"
                source={appAssetSources.homeBackground}
                style={styles.homeIntroImage}
              />
            </View>

            <View style={styles.homePrompt}>
              <Text style={styles.homePromptText}>
                Lướt xuống vòng xoay và chọn căn phòng hợp với mình hôm nay.
              </Text>
            </View>
          </View>
        </View>

      <View pointerEvents="none" style={styles.homeHeroLayerLip} />

      <View style={styles.homeWheelSection}>
        <View pointerEvents="box-none" style={styles.homeWheelStage}>
          <Animated.Image
            accessibilityIgnoresInvertColors
            pointerEvents="none"
            resizeMode="contain"
            source={appAssetSources.wheel}
            style={[
              styles.homeVector,
              {
                width: wheelSize,
                height: wheelSize,
                transform: [{ rotate: wheelRotation }],
              },
            ]}
          />

          <View style={styles.homeWheelControls} pointerEvents="box-none">
            <Pressable
              accessibilityLabel="Xoay vòng sang trái"
              accessibilityRole="button"
              onPress={() => rotateWheel(-1)}
              style={({ pressed }) => [styles.homeSpinButton, styles.homeSpinButtonLeft, pressed && styles.homeButtonPressed]}
            >
              <Text style={styles.homeSpinButtonText}>‹</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Xoay vòng sang phải"
              accessibilityRole="button"
              onPress={() => rotateWheel(1)}
              style={({ pressed }) => [styles.homeSpinButton, styles.homeSpinButtonRight, pressed && styles.homeButtonPressed]}
            >
              <Text style={styles.homeSpinButtonText}>›</Text>
            </Pressable>
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.homeWheelLinks}>
          {homeWheelLinks.map((link) => {
            const isActiveWheelLink = link.id === activeWheelLinkId;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActiveWheelLink }}
                key={link.id}
                onPress={() => onChangeItem(link.id)}
                style={({ pressed }) => [
                  styles.homeWheelLink,
                  styles[`homeWheelLink${link.style[0].toUpperCase()}${link.style.slice(1)}`],
                  link.style === 'focus' ? { left: lowerWheelLinkInset } : null,
                  link.style === 'healing' ? { right: lowerWheelLinkInset } : null,
                  isActiveWheelLink && styles.homeWheelLinkActive,
                  pressed && styles.homeWheelLinkPressed,
                ]}
              >
                <Text
                  style={[styles.homeWheelLinkText, isActiveWheelLink && styles.homeWheelLinkTextActive]}
                  numberOfLines={1}
                >
                  {link.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.homeIntroCards}>
        <View style={[styles.homeFeatureSection, styles.homeFeatureSectionBlue]}>
          <WaveEdge position="top" />
          <WaveEdge position="bottom" />
          <View style={styles.homeFeatureCopy}>
            <Text style={[styles.homeFeatureEyebrow, styles.homeFeatureTextOnBlue]}>Phòng cộng đồng</Text>
            <Text style={[styles.homeFeatureTitle, styles.homeFeatureTitleOnBlueLeft]}>Một góc để mọi người cùng ở lại với nhau.</Text>
            <Text style={[styles.homeFeatureBody, styles.homeFeatureTextOnBlue]}>
              Nơi gom những chia sẻ nhẹ nhàng và lời nhắn từ cộng đồng Love Yourself.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChangeItem('community')}
              style={({ pressed }) => [styles.homeFeatureButton, styles.homeFeatureButtonLight, pressed && styles.homeFeatureButtonPressed]}
            >
              <Text style={[styles.homeFeatureButtonText, styles.homeFeatureButtonTextLight]}>Vào phòng cộng đồng</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.homeFeatureSection, styles.homeFeatureSectionDiary]}>
          <View style={[styles.homeFeatureCopy, styles.homeFeatureCopyRight]}>
            <Text style={[styles.homeFeatureEyebrow, styles.homeFeatureTextRight]}>Phòng nhật ký</Text>
            <Text style={[styles.homeFeatureTitle, styles.homeFeatureTextRight]}>Một căn phòng mới để giữ lại những dòng riêng.</Text>
            <Text style={[styles.homeFeatureBody, styles.homeFeatureTextRight, styles.homeFeatureBodyRight]}>
              Phòng nhật ký sẽ được dựng sau. Trước mắt mình để căn phòng này trống đã.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChangeItem('diary')}
              style={({ pressed }) => [
                styles.homeFeatureButton,
                styles.homeFeatureCopyRightButton,
                pressed && styles.homeFeatureButtonPressed,
              ]}
            >
              <Text style={styles.homeFeatureButtonText}>Vào phòng nhật ký</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.homeFeatureSection, styles.homeFeatureSectionBlue, styles.homeFeatureSectionOfficial]}>
          <WaveEdge position="top" />
          <View style={styles.homeFeatureCopy}>
            <Text style={[styles.homeFeatureEyebrow, styles.homeFeatureTextOnBlue]}>Web chính của 138knitwear</Text>
            <Text style={[styles.homeFeatureTitle, styles.homeFeatureTitleOnBlueLeft]}>Ghé 138knitwear để xem những collection mới nhất.</Text>
            <Text style={[styles.homeFeatureBody, styles.homeFeatureTextOnBlue]}>
              Xem sản phẩm knitwear, phụ kiện, lookbook và tin tức mới từ 138.
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL('https://138knitwear.com/')}
              style={({ pressed }) => [styles.homeFeatureButton, styles.homeFeatureButtonLight, pressed && styles.homeFeatureButtonPressed]}
            >
              <Text style={[styles.homeFeatureButtonText, styles.homeFeatureButtonTextLight]}>Mở 138knitwear.com</Text>
            </Pressable>
          </View>
        </View>
      </View>
      </ScrollView>

      {isAboutVisible ? (
        <View style={styles.homeAboutOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng giới thiệu"
            onPress={onCloseAbout}
            style={styles.homeAboutBackdrop}
          />
          <View style={styles.homeAboutBox}>
            <View style={styles.homeAboutHeader}>
              <Text style={styles.homeAboutEyebrow}>Về căn phòng này</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng giới thiệu"
                onPress={onCloseAbout}
                style={({ pressed }) => [styles.homeAboutCloseButton, pressed && styles.homeButtonPressed]}
              >
                <Text style={styles.homeAboutCloseText}>x</Text>
              </Pressable>
            </View>
            <Text style={styles.homeAboutTitle}>Một chỗ nhỏ để bạn quay về với mình.</Text>
            <Text style={styles.homeAboutBody}>
              Love Yourself gom những căn phòng nhẹ nhàng: nghe nhạc, viết vài dòng,
              đọc lời nhắn từ cộng đồng và nghỉ một chút trước khi bước tiếp.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function EmptyScreen() {
  return <View style={styles.emptyScreen} />;
}

function ProfileScreen({ user, onAuthPress, onAuthChange }) {
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const streakCount = user?.returnStreak?.currentStreak || 0;
  const visitedCount = user?.returnStreak?.visitedDates?.length || 0;
  const selectedGenderLabel = genderOptions.find((option) => option.id === user?.gender)?.label || 'Chưa cập nhật';

  useEffect(() => {
    setName(user?.name || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || '');
    setMessage(null);
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/api/auth/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: Number(age),
          gender,
        }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Chưa thể cập nhật hồ sơ.');
      }

      onAuthChange(data.user);
      setMessage({ type: 'success', text: data.message || 'Hồ sơ đã được lưu.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.name === 'AbortError' || error.message === 'Network request failed'
          ? 'Không kết nối được máy chủ. Anh chạy npm run dev rồi thử lại nha.'
          : error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.profileScreen}>
        <ScrollView
          alwaysBounceHorizontal={false}
          contentContainerStyle={styles.profileScrollContent}
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileGuestHero}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={appAssetSources.mascotWithSpeaker}
              style={styles.profileGuestImage}
            />
            <Text style={styles.profileEyebrow}>Phòng cá nhân</Text>
            <Text style={styles.profileTitle}>Một góc nhỏ chỉ dành cho bạn.</Text>
            <Text style={styles.profileBody}>
              Đăng nhập để lưu hồ sơ, giữ nhịp quay lại và mở dần những phần riêng của Love Yourself.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onAuthPress}
              style={({ pressed }) => [styles.profilePrimaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.profilePrimaryButtonText}>Đăng nhập hoặc đăng ký</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.profileScreen}>
      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.profileScrollContent}
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user.name?.trim()?.[0]?.toUpperCase() || 'Y'}</Text>
          </View>
          <View style={styles.profileHeaderCopy}>
            <Text style={[styles.profileEyebrow, styles.profileHeaderEyebrow]}>Phòng cá nhân</Text>
            <Text style={[styles.profileTitle, styles.profileHeaderTitle]} numberOfLines={2}>{user.name}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatValue}>{streakCount}</Text>
            <Text style={styles.profileStatLabel}>ngày quay lại</Text>
          </View>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatValue}>{visitedCount}</Text>
            <Text style={styles.profileStatLabel}>lần ghé phòng</Text>
          </View>
        </View>

        <View style={styles.profilePanel}>
          <Text style={styles.profilePanelTitle}>Thông tin của bạn</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setName}
            placeholder="Tên của bạn"
            placeholderTextColor="#9d8f86"
            style={styles.profileInput}
            value={name}
          />
          <TextInput
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={3}
            onChangeText={setAge}
            placeholder="Tuổi"
            placeholderTextColor="#9d8f86"
            style={styles.profileInput}
            value={age}
          />
          <View style={styles.profileGenderRow}>
            {genderOptions.map((option) => {
              const isSelected = gender === option.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.id}
                  onPress={() => setGender(option.id)}
                  style={({ pressed }) => [
                    styles.profileGenderButton,
                    isSelected && styles.profileGenderButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.profileGenderText, isSelected && styles.profileGenderTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {message ? (
            <Text style={[styles.profileMessage, message.type === 'error' ? styles.authMessageError : styles.authMessageSuccess]}>
              {message.text}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={handleSaveProfile}
            style={({ pressed }) => [styles.profilePrimaryButton, pressed && styles.buttonPressed, isSaving && styles.buttonDisabled]}
          >
            <Text style={styles.profilePrimaryButtonText}>{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}</Text>
          </Pressable>
        </View>

        <View style={styles.profilePanel}>
          <Text style={styles.profilePanelTitle}>Tóm tắt hiện tại</Text>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Nhóm tuổi</Text>
            <Text style={styles.profileInfoValue}>{user.ageGroup || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Giới tính</Text>
            <Text style={styles.profileInfoValue}>{selectedGenderLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onAuthPress}
            style={({ pressed }) => [styles.profileSecondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.profileSecondaryButtonText}>Quản lý tài khoản</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthScreen({ user, isCheckingSession, onAuthChange, onBack }) {
  const tabDragStartXRef = useRef(null);
  const tabSlideValue = useRef(new Animated.Value(0)).current;
  const [authTabsWidth, setAuthTabsWidth] = useState(0);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isFacebookSubmitting, setIsFacebookSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);
  const isRegister = mode === 'register';

  const handleModeChange = (nextMode) => {
    if (nextMode === 'register' && authConfig?.passwordRegistrationEnabled === false) {
      setMessage({
        type: 'error',
        text: 'Đăng ký bằng mật khẩu đang tạm khóa. Bạn dùng Google để tạo tài khoản mới nha.',
      });
      return;
    }

    setMode(nextMode);
    setMessage(null);
  };

  useEffect(() => {
    let ignore = false;

    fetchWithTimeout(`${apiBaseUrl}/api/auth/config`, { credentials: 'include' })
      .then(readApiResponse)
      .then((data) => {
        if (!ignore) setAuthConfig(data);
      })
      .catch(() => {
        // Existing password login remains available if config metadata cannot load.
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    Animated.spring(tabSlideValue, {
      toValue: isRegister ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 90,
    }).start();
  }, [isRegister, tabSlideValue]);

  const handleTabSwipeEnd = (event) => {
    if (tabDragStartXRef.current === null) return;

    const dragDistance = event.nativeEvent.pageX - tabDragStartXRef.current;
    tabDragStartXRef.current = null;

    if (Math.abs(dragDistance) < 34) return;
    handleModeChange(dragDistance < 0 ? 'register' : 'login');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    if (isRegister && (password.length < 15 || password.length > 128)) {
      setMessage({ type: 'error', text: 'Mật khẩu mới cần từ 15 đến 128 ký tự.' });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name,
      email,
      password,
    };

    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Chưa thể xử lý yêu cầu.');
      }

      if (data.requiresVerification) {
        setMode('login');
        setMessage({ type: 'success', text: data.message });
        setName('');
        setPassword('');
        return;
      }

      onAuthChange(data.user);
      setMessage({ type: 'success', text: data.message || 'Đăng nhập thành công!' });
      setPassword('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.name === 'AbortError' || error.message === 'Network request failed'
          ? 'Không kết nối được máy chủ. Anh chạy npm run dev rồi thử lại nha.'
          : error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    const isGoogle = provider === 'google';
    const setIsSocialSubmitting = isGoogle ? setIsGoogleSubmitting : setIsFacebookSubmitting;
    setIsSocialSubmitting(true);
    setMessage(null);

    try {
      const mobileReturnTo = Linking.createURL('auth');
      const authUrl = `${apiBaseUrl}/api/auth/${provider}/start?${new URLSearchParams({
        returnTo: '/',
        mobileReturnTo,
      }).toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, mobileReturnTo);

      if (result.type !== 'success') {
        return;
      }

      const authToken = getQueryParam(result.url, 'authToken');
      if (!authToken) {
        throw new Error(`${isGoogle ? 'Google' : 'Facebook'} chưa trả phiên đăng nhập cho app.`);
      }

      const response = await fetchWithTimeout(`${apiBaseUrl}/api/auth/mobile/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || `Chưa thể hoàn tất đăng nhập ${isGoogle ? 'Google' : 'Facebook'}.`);
      }

      onAuthChange(data.user);
      setMessage({ type: 'success', text: data.message || `Đăng nhập ${isGoogle ? 'Google' : 'Facebook'} thành công!` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.name === 'AbortError' || error.message === 'Network request failed'
          ? 'Không kết nối được máy chủ. Anh chạy npm run dev rồi thử lại nha.'
          : error.message,
      });
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMessage(null);

    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Chưa thể đăng xuất lúc này.');

      onAuthChange(null);
      setMode('login');
      setMessage({ type: 'success', text: 'Bạn đã đăng xuất.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isCheckingSession) {
    return (
      <View style={[styles.authScreen, styles.authLoading]}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.authLoadingText}>Đang kiểm tra phiên đăng nhập...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView style={styles.authScreen} contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.authBackLink}>
          <Text style={styles.authBackIcon}>‹</Text>
        </Pressable>
        <View style={styles.authCard}>
          <View style={styles.authBrand}>
            <Text style={styles.authBrandTitle}>LOVE YOURSELF</Text>
            <Text style={styles.authBrandSubtitle}>138knitwear</Text>
          </View>
          <Text style={styles.authEyebrow}>Tài khoản của bạn</Text>
          <Text style={styles.authTitle}>{user.name}</Text>
          <Text style={styles.authBody}>{user.email}</Text>
          {message ? (
            <Text style={[styles.authMessage, message.type === 'error' ? styles.authMessageError : styles.authMessageSuccess]}>
              {message.text}
            </Text>
          ) : null}
          <Pressable
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [styles.authSubmitButton, pressed && styles.buttonPressed, isLoggingOut && styles.buttonDisabled]}
          >
            <Text style={styles.authSubmitText}>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authKeyboard}>
      <ScrollView style={styles.authScreen} contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.authBackLink}>
          <Text style={styles.authBackIcon}>‹</Text>
        </Pressable>
        <View style={styles.authCard}>
          <View style={styles.authBrand}>
            <Text style={styles.authBrandTitle}>LOVE YOURSELF</Text>
            <Text style={styles.authBrandSubtitle}>138knitwear</Text>
          </View>

          <View
            style={styles.authTabs}
            onLayout={(event) => setAuthTabsWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(event) => {
              tabDragStartXRef.current = event.nativeEvent.pageX;
            }}
            onResponderRelease={handleTabSwipeEnd}
            onResponderTerminate={() => {
              tabDragStartXRef.current = null;
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.authTabIndicator,
                {
                  width: authTabsWidth > 0 ? (authTabsWidth - 10) / 2 : 0,
                  transform: [{
                    translateX: tabSlideValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, authTabsWidth > 0 ? (authTabsWidth - 10) / 2 : 0],
                    }),
                  }],
                },
              ]}
            />
            <Pressable
              onPress={() => handleModeChange('login')}
              style={styles.authTab}
            >
              <Text style={[styles.authTabText, !isRegister && styles.authTabTextActive]}>Đăng nhập</Text>
            </Pressable>
            <Pressable
              onPress={() => handleModeChange('register')}
              style={styles.authTab}
            >
              <Text style={[styles.authTabText, isRegister && styles.authTabTextActive]}>Đăng ký</Text>
            </Pressable>
          </View>

          <Text style={styles.authEyebrow}>{isRegister ? 'Chào bạn mới' : 'Mừng bạn quay lại'}</Text>
          <Text style={styles.authTitle}>{isRegister ? 'Tạo một tài khoản nha.' : 'Mình gặp lại nhau rồi.'}</Text>

          {message ? (
            <Text style={[styles.authMessage, message.type === 'error' ? styles.authMessageError : styles.authMessageSuccess]}>
              {message.text}
            </Text>
          ) : null}

          {isRegister ? (
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Mình nên gọi bạn là gì?"
              placeholderTextColor="#9d8f86"
              style={styles.authInput}
              value={name}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
            onChangeText={setEmail}
            placeholder="ban@email.com"
            placeholderTextColor="#9d8f86"
            style={styles.authInput}
            value={email}
          />

          <TextInput
            maxLength={128}
            onChangeText={setPassword}
            placeholder={isRegister ? 'Mật khẩu từ 15 ký tự' : 'Nhập mật khẩu'}
            placeholderTextColor="#9d8f86"
            secureTextEntry
            style={styles.authInput}
            value={password}
          />

          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.authSubmitButton, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]}
          >
            <Text style={styles.authSubmitText}>
              {isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
            </Text>
          </Pressable>

          {authConfig?.googleEnabled !== false || authConfig?.facebookEnabled !== false ? (
            <View style={styles.socialLoginRow}>
              {authConfig?.googleEnabled !== false ? (
                <View style={styles.socialLoginItem}>
                  <Pressable
                    disabled={isGoogleSubmitting}
                    onPress={() => handleSocialLogin('google')}
                    style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed, isGoogleSubmitting && styles.buttonDisabled]}
                  >
                    <Text style={styles.googleBadge}>G</Text>
                  </Pressable>
                  <Text style={styles.googleButtonText}>
                    {isGoogleSubmitting ? 'Đang mở...' : 'Google'}
                  </Text>
                </View>
              ) : null}

              {authConfig?.facebookEnabled !== false ? (
                <View style={styles.socialLoginItem}>
                  <Pressable
                    disabled={isFacebookSubmitting}
                    onPress={() => handleSocialLogin('facebook')}
                    style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed, isFacebookSubmitting && styles.buttonDisabled]}
                  >
                    <Text style={styles.googleBadge}>f</Text>
                  </Pressable>
                  <Text style={styles.googleButtonText}>
                    {isFacebookSubmitting ? 'Đang mở...' : 'Facebook'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoomTransitionOverlay({ color, transitionKey }) {
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressValue.setValue(0);
    Animated.timing(progressValue, {
      toValue: 1,
      duration: roomTransitionDuration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [progressValue, transitionKey]);

  const bloomOpacity = progressValue.interpolate({
    inputRange: [0, 0.36, 0.4, 0.92, 1],
    outputRange: [0, 0, 1, 1, 0],
  });
  const bloomScale = progressValue.interpolate({
    inputRange: [0, 0.36, 0.4, 0.9, 1],
    outputRange: [0.08, 0.08, 0.22, 72, 72],
  });
  const glowOpacity = progressValue.interpolate({
    inputRange: [0, 0.14, 0.4, 0.9, 1],
    outputRange: [0, 0.34, 0.42, 0.16, 0],
  });
  const mascotOpacity = progressValue.interpolate({
    inputRange: [0, 0.12, 0.76, 1],
    outputRange: [0, 1, 1, 0],
  });
  const mascotScale = progressValue.interpolate({
    inputRange: [0, 0.12, 0.54, 1],
    outputRange: [0.6, 1.08, 1, 0.88],
  });
  const mascotTranslateY = progressValue.interpolate({
    inputRange: [0, 0.12, 0.54, 1],
    outputRange: [24, 0, -10, -24],
  });
  const mascotRotate = progressValue.interpolate({
    inputRange: [0, 0.12, 0.54, 1],
    outputRange: ['-8deg', '3deg', '-2deg', '5deg'],
  });

  return (
    <View pointerEvents="none" style={styles.roomTransitionOverlay}>
      <Animated.View
        style={[
          styles.roomTransitionBloom,
          {
            backgroundColor: color,
            opacity: bloomOpacity,
            transform: [{ scale: bloomScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.roomTransitionGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: bloomScale }],
          },
        ]}
      />
      <Animated.Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={appAssetSources.transitionMascot}
        style={[
          styles.roomTransitionMascot,
          {
            opacity: mascotOpacity,
            transform: [
              { translateY: mascotTranslateY },
              { scale: mascotScale },
              { rotate: mascotRotate },
            ],
          },
        ]}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PatrickHand_400Regular,
  });
  const [activeItemId, setActiveItemId] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('main');
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [roomTransition, setRoomTransition] = useState(null);
  const [isHomeStickyTopBarVisible, setIsHomeStickyTopBarVisible] = useState(false);
  const [isHomeAboutVisible, setIsHomeAboutVisible] = useState(false);
  const isRouteTransitioningRef = useRef(false);
  const transitionTimersRef = useRef([]);

  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}/api/auth/me`, { credentials: 'include' }, 5000);
        const data = await readApiResponse(response);
        if (!ignore) setUser(data?.user || null);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => () => {
    transitionTimersRef.current.forEach(clearTimeout);
    transitionTimersRef.current = [];
    isRouteTransitioningRef.current = false;
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.authRoute}>
        <StatusBar style="light" backgroundColor="#4789c8" />
      </View>
    );
  }

  const runRoomTransition = (applyTransition, color = '#f8db8e') => {
    if (isRouteTransitioningRef.current) return;

    isRouteTransitioningRef.current = true;
    transitionTimersRef.current.forEach(clearTimeout);
    transitionTimersRef.current = [];
    setRoomTransition({ color, key: Date.now() });

    const routeTimer = setTimeout(applyTransition, roomTransitionRouteDelay);
    const endTimer = setTimeout(() => {
      isRouteTransitioningRef.current = false;
      setRoomTransition(null);
    }, roomTransitionDuration);
    transitionTimersRef.current = [routeTimer, endTimer];
  };

  const changeMainItem = (itemId) => {
    if (currentScreen === 'main' && activeItemId === itemId) return;

    runRoomTransition(() => {
      setCurrentScreen('main');
      setActiveItemId(itemId);
      if (itemId === 'home') setIsHomeStickyTopBarVisible(false);
      if (itemId !== 'home') setIsHomeAboutVisible(false);
    }, roomTransitionColors[itemId] || '#f8db8e');
  };

  const showHomeAbout = () => {
    if (currentScreen === 'main' && activeItemId === 'home') {
      setIsHomeAboutVisible(true);
      return;
    }

    runRoomTransition(() => {
      setCurrentScreen('main');
      setActiveItemId('home');
      setIsHomeStickyTopBarVisible(false);
      setIsHomeAboutVisible(true);
    }, roomTransitionColors.home);
  };

  const openAuthScreen = () => {
    if (currentScreen === 'auth') return;

    runRoomTransition(() => {
      setCurrentScreen('auth');
      setActiveItemId('profile');
    }, roomTransitionColors.profile);
  };

  const closeAuthScreen = () => {
    runRoomTransition(() => {
      setCurrentScreen('main');
      setActiveItemId('profile');
    }, roomTransitionColors.profile);
  };

  const renderMainScreen = () => {
    if (activeItemId === 'home') {
      return (
        <HomeScreen
          isAboutVisible={isHomeAboutVisible}
          onAuthPress={openAuthScreen}
          onChangeItem={changeMainItem}
          onCloseAbout={() => setIsHomeAboutVisible(false)}
          onIntroPress={showHomeAbout}
          onStickyTopBarVisibilityChange={setIsHomeStickyTopBarVisible}
          user={user}
        />
      );
    }
    if (activeItemId === 'profile') {
      return (
        <ProfileScreen
          onAuthChange={setUser}
          onAuthPress={openAuthScreen}
          user={user}
        />
      );
    }
    return <EmptyScreen />;
  };
  const shouldShowTopHeroBar = activeItemId !== 'home' || isHomeStickyTopBarVisible;

  return (
    <View style={currentScreen === 'auth' ? styles.authRoute : styles.container}>
      {currentScreen === 'auth' ? (
        <SafeAreaView style={styles.authRouteSafeArea}>
          <StatusBar style="light" backgroundColor="#4789c8" />
          <AuthScreen
            isCheckingSession={isCheckingSession}
            onAuthChange={setUser}
            onBack={closeAuthScreen}
            user={user}
          />
        </SafeAreaView>
      ) : (
        <>
          {shouldShowTopHeroBar ? (
            <SafeAreaView style={[styles.topSafeArea, activeItemId === 'home' && styles.topSafeAreaFloating]}>
              <StatusBar style="light" backgroundColor="#4789c8" />
              <TopHeroBar user={user} onAuthPress={openAuthScreen} onIntroPress={showHomeAbout} />
            </SafeAreaView>
          ) : (
            <StatusBar style="light" backgroundColor="#4789c8" />
          )}
          <View style={styles.screenBody}>
            {renderMainScreen()}
          </View>
          <HeroBar
            activeItemId={activeItemId}
            onChangeItem={(itemId) => {
              changeMainItem(itemId);
            }}
          />
        </>
      )}
      {roomTransition ? (
        <RoomTransitionOverlay color={roomTransition.color} transitionKey={roomTransition.key} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ec',
  },
  topSafeArea: {
    backgroundColor: '#4789c8',
  },
  topSafeAreaFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
    shadowColor: '#315f91',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  screenBody: {
    flex: 1,
    backgroundColor: '#fff7ec',
  },
  emptyScreen: {
    flex: 1,
  },
  profileScreen: {
    flex: 1,
    backgroundColor: '#fff7ec',
  },
  profileScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 132,
    gap: 16,
  },
  profileGuestHero: {
    minHeight: 560,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  profileGuestImage: {
    width: 168,
    height: 168,
    marginBottom: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    backgroundColor: '#4789c8',
    padding: 16,
    shadowColor: '#315f91',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: '#f8db8e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#4789c8',
    fontSize: 38,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 43,
  },
  profileHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileEyebrow: {
    color: '#d47496',
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 19,
    textTransform: 'uppercase',
  },
  profileTitle: {
    color: '#315f91',
    fontSize: 34,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 38,
    textAlign: 'center',
  },
  profileHeaderEyebrow: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileHeaderTitle: {
    color: '#ffffff',
    textAlign: 'left',
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  profileBody: {
    maxWidth: 314,
    color: '#5d7895',
    fontSize: 18,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 22,
    textAlign: 'center',
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileStatBox: {
    flex: 1,
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: '#d8eff4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  profileStatValue: {
    color: '#4789c8',
    fontSize: 38,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 42,
  },
  profileStatLabel: {
    color: '#315f91',
    fontSize: 15,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  profilePanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237, 229, 210, 0.95)',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 12,
    shadowColor: '#315f91',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  profilePanelTitle: {
    color: '#315f91',
    fontSize: 24,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 28,
  },
  profileInput: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237, 229, 210, 0.95)',
    backgroundColor: '#fff7ec',
    color: '#314236',
    fontSize: 19,
    fontFamily: 'PatrickHand_400Regular',
    paddingHorizontal: 14,
  },
  profileGenderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileGenderButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(71, 137, 200, 0.24)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileGenderButtonActive: {
    backgroundColor: '#4789c8',
    borderColor: '#4789c8',
  },
  profileGenderText: {
    color: '#4789c8',
    fontSize: 17,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  profileGenderTextActive: {
    color: '#ffffff',
  },
  profileMessage: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  profilePrimaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#4789c8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  profilePrimaryButtonText: {
    color: '#ffffff',
    fontSize: 19,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 23,
    textAlign: 'center',
  },
  profileSecondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(71, 137, 200, 0.24)',
    backgroundColor: '#d8eff4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  profileSecondaryButtonText: {
    color: '#4789c8',
    fontSize: 18,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 22,
  },
  profileInfoRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileInfoLabel: {
    color: '#647064',
    fontSize: 17,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  profileInfoValue: {
    flexShrink: 1,
    color: '#315f91',
    fontSize: 18,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 22,
    textAlign: 'right',
  },
  homeScreenWrap: {
    flex: 1,
    backgroundColor: '#4789c8',
  },
  homeScreen: {
    flex: 1,
    backgroundColor: '#4789c8',
  },
  homeScrollContent: {
    minHeight: 1320,
    paddingBottom: 180,
    backgroundColor: '#4789c8',
  },
  homeOpeningCluster: {
    position: 'relative',
    zIndex: 30,
    elevation: 30,
    overflow: 'hidden',
    backgroundColor: '#4789c8',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  homeInlineTopSafeArea: {
    backgroundColor: '#4789c8',
  },
  homeIntroSection: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 34,
    backgroundColor: '#4789c8',
  },
  homeIntroFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 8,
    backgroundColor: '#fff6dd',
    shadowColor: '#ebacb6',
    shadowOpacity: 0.82,
    shadowRadius: 0,
    shadowOffset: { width: 10, height: 10 },
    elevation: 6,
  },
  homeIntroImage: {
    width: '100%',
    height: '100%',
  },
  homePrompt: {
    marginTop: 26,
    paddingHorizontal: 18,
  },
  homePromptText: {
    color: 'rgba(255, 255, 255, 0.94)',
    fontSize: 24,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 27,
    textAlign: 'center',
  },
  homeAboutBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: '#fff7ec',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#315f91',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  homeAboutOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 80,
  },
  homeAboutBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 95, 145, 0.38)',
  },
  homeAboutHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  homeAboutEyebrow: {
    color: '#d47496',
    fontSize: 15,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 18,
  },
  homeAboutCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8eff4',
  },
  homeAboutCloseText: {
    color: '#4789c8',
    fontSize: 24,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 28,
  },
  homeAboutTitle: {
    marginTop: 4,
    color: '#315f91',
    fontSize: 28,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 31,
  },
  homeAboutBody: {
    marginTop: 8,
    color: '#5d7895',
    fontSize: 17,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 21,
  },
  homeHeroLayerLip: {
    position: 'relative',
    zIndex: 29,
    elevation: 29,
    height: 40,
    marginTop: -40,
    backgroundColor: '#4789c8',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  homeWheelSection: {
    position: 'relative',
    zIndex: 1,
    height: 500,
    overflow: 'hidden',
    marginTop: -78,
    backgroundColor: '#fff7ec',
  },
  homeWheelStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 510,
    alignItems: 'center',
    overflow: 'visible',
  },
  homeVector: {
    position: 'absolute',
    top: -430,
  },
  homeWheelControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 430,
  },
  homeSpinButton: {
    position: 'absolute',
    top: 276,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeSpinButtonLeft: {
    left: 14,
  },
  homeSpinButtonRight: {
    right: 14,
  },
  homeSpinButtonText: {
    color: '#4789c8',
    fontSize: 36,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 40,
  },
  homeButtonPressed: {
    opacity: 0.68,
  },
  homeWheelLinks: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 430,
  },
  homeWheelLink: {
    position: 'absolute',
    width: 128,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#4789c8',
    paddingHorizontal: 8,
    shadowColor: '#ebacb6',
    shadowOpacity: 0.82,
    shadowRadius: 0,
    shadowOffset: { width: 5, height: 5 },
    elevation: 4,
  },
  homeWheelLinkActive: {
    backgroundColor: '#f8db8e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    shadowColor: '#4789c8',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    transform: [{ translateY: -2 }],
  },
  homeWheelLinkCard: {
    left: 14,
    top: 332,
  },
  homeWheelLinkSound: {
    right: 14,
    top: 332,
  },
  homeWheelLinkFocus: {
    left: '14%',
    top: 390,
  },
  homeWheelLinkHealing: {
    right: '14%',
    top: 390,
  },
  homeWheelLinkPressed: {
    opacity: 0.76,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  homeWheelLinkText: {
    color: '#fff7ec',
    fontSize: 14,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 17,
  },
  homeWheelLinkTextActive: {
    color: '#4789c8',
  },
  homeIntroCards: {
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#fff7ec',
  },
  homeFeatureSection: {
    position: 'relative',
    minHeight: 340,
    overflow: 'hidden',
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#fff7ec',
    padding: 22,
  },
  homeFeatureSectionBlue: {
    marginHorizontal: -14,
    backgroundColor: '#4789c8',
    paddingHorizontal: 36,
    paddingTop: 72,
    paddingBottom: 86,
  },
  homeFeatureSectionDiary: {
    minHeight: 250,
    backgroundColor: '#fff7ec',
    paddingBottom: 12,
  },
  homeFeatureSectionOfficial: {
    minHeight: 260,
    paddingBottom: 42,
  },
  homeFeatureCopy: {
    position: 'relative',
    zIndex: 2,
    gap: 10,
  },
  homeWaveEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 62,
    zIndex: 1,
  },
  homeWaveEdgeTop: {
    top: -1,
  },
  homeWaveEdgeBottom: {
    bottom: -1,
  },
  homeFeatureCopyRight: {
    alignItems: 'flex-end',
  },
  homeFeatureTextRight: {
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  homeFeatureBodyRight: {
    maxWidth: 330,
  },
  homeFeatureCopyRightButton: {
    alignSelf: 'flex-end',
  },
  homeFeatureEyebrow: {
    color: '#4789c8',
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 19,
  },
  homeFeatureTitle: {
    maxWidth: 330,
    color: '#315f91',
    fontSize: 30,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 32,
  },
  homeFeatureBody: {
    maxWidth: 278,
    color: '#5d7895',
    fontSize: 13,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 17,
  },
  homeFeatureTitleOnBlue: {
    color: '#ffffff',
    maxWidth: 330,
    textAlign: 'right',
  },
  homeFeatureTitleOnBlueLeft: {
    color: '#ffffff',
    maxWidth: 330,
  },
  homeFeatureTextOnBlue: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  homeFeatureButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#4789c8',
    paddingHorizontal: 18,
    shadowColor: '#ebacb6',
    shadowOpacity: 0.82,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
    elevation: 3,
  },
  homeFeatureButtonLight: {
    backgroundColor: '#fff7ec',
  },
  homeFeatureButtonPressed: {
    opacity: 0.76,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  homeFeatureButtonText: {
    color: '#fff7ec',
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 19,
  },
  homeFeatureButtonTextLight: {
    color: '#4789c8',
  },
  homeFeatureImage: {
    position: 'absolute',
    right: -16,
    bottom: -20,
    width: 132,
    height: 132,
    opacity: 0.92,
  },
  homeFeatureImageDiary: {
    left: -18,
    right: undefined,
    top: -8,
    bottom: undefined,
    opacity: 0.34,
  },
  authRoute: {
    flex: 1,
    backgroundColor: '#4789c8',
  },
  authRouteSafeArea: {
    flex: 1,
    backgroundColor: '#4789c8',
  },
  topHeroBar: {
    position: 'relative',
    zIndex: 2,
    minHeight: 70,
    backgroundColor: '#4789c8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '36%',
    minWidth: 0,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'PatrickHand_400Regular',
    letterSpacing: 0,
    lineHeight: 20,
  },
  brandSubtitle: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 14,
    opacity: 0.92,
  },
  topHeroButton: {
    position: 'absolute',
    top: 17,
    minWidth: 78,
    maxWidth: 90,
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#315f91',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  topHeroButtonLeft: {
    left: 14,
  },
  topHeroButtonRight: {
    right: 14,
  },
  topHeroButtonPressed: {
    backgroundColor: '#d8eff4',
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  topHeroButtonText: {
    color: '#4789c8',
    fontSize: 11,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 14,
  },
  heroBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  heroBar: {
    width: '100%',
    height: 98,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
    overflow: 'hidden',
    shadowColor: '#315f91',
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 18,
  },
  activeIndicator: {
    position: 'absolute',
    left: 14,
    top: 10,
    height: 60,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    backgroundColor: '#4789c8',
  },
  heroBarItem: {
    height: 60,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroBarItemActive: {
    transform: [{ translateY: -1 }],
  },
  heroBarItemPressed: {
    opacity: 0.72,
  },
  heroBarLabel: {
    maxWidth: 74,
    color: 'rgba(71, 137, 200, 0.78)',
    fontSize: 11,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 12,
  },
  heroBarLabelActive: {
    color: '#ffffff',
  },
  icon: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  homeRoof: {
    position: 'absolute',
    left: 5,
    top: 4,
    width: 14,
    height: 14,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  homeBody: {
    position: 'absolute',
    left: 6,
    top: 11,
    width: 12,
    height: 9,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    top: 6,
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  dotLeft: {
    left: 6,
  },
  dotRight: {
    right: 6,
  },
  smileLine: {
    position: 'absolute',
    left: 5,
    bottom: 6,
    width: 14,
    height: 8,
    borderBottomWidth: 2,
    borderRadius: 999,
  },
  diaryPage: {
    position: 'absolute',
    left: 5,
    top: 4,
    width: 14,
    height: 17,
    borderWidth: 2,
    borderRadius: 3,
  },
  diaryLine: {
    position: 'absolute',
    left: 9,
    top: 11,
    width: 7,
    height: 2,
    borderRadius: 99,
  },
  profileHead: {
    position: 'absolute',
    left: 8,
    top: 4,
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 999,
  },
  profileIconBody: {
    position: 'absolute',
    left: 5,
    bottom: 4,
    width: 14,
    height: 8,
    borderWidth: 2,
    borderRadius: 999,
  },
  authKeyboard: {
    flex: 1,
  },
  authScreen: {
    flex: 1,
    backgroundColor: '#4789c8',
  },
  authLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 90,
  },
  authLoadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'PatrickHand_400Regular',
  },
  authPage: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 18,
  },
  authBackLink: {
    position: 'absolute',
    left: 18,
    top: 6,
    zIndex: 2,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#315f91',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  authBackIcon: {
    color: '#4789c8',
    fontSize: 32,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 36,
  },
  authCard: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(237, 229, 210, 0.82)',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#315f91',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  authBrand: {
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  authBrandTitle: {
    color: '#4789c8',
    fontSize: 23,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 27,
  },
  authBrandSubtitle: {
    color: '#4789c8',
    fontSize: 15,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 19,
  },
  authTabs: {
    position: 'relative',
    flexDirection: 'row',
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#d8eff4',
    padding: 5,
    gap: 4,
    overflow: 'hidden',
  },
  authTabIndicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    width: '50%',
    borderRadius: 14,
    backgroundColor: '#4789c8',
  },
  authTab: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  authTabText: {
    color: '#4789c8',
    fontSize: 19,
    fontFamily: 'PatrickHand_400Regular',
  },
  authTabTextActive: {
    color: '#ffffff',
  },
  authEyebrow: {
    color: '#d47496',
    fontSize: 17,
    fontFamily: 'PatrickHand_400Regular',
    textTransform: 'uppercase',
  },
  authTitle: {
    color: '#314236',
    fontSize: 35,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 40,
  },
  authBody: {
    color: '#647064',
    fontSize: 18,
    fontFamily: 'PatrickHand_400Regular',
  },
  authMessage: {
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  authMessageError: {
    color: '#9b3e56',
    backgroundColor: '#ffe9ef',
  },
  authMessageSuccess: {
    color: '#4d7560',
    backgroundColor: '#e8f7ef',
  },
  authInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(237, 229, 210, 0.95)',
    backgroundColor: '#fff7ec',
    color: '#314236',
    fontSize: 19,
    fontFamily: 'PatrickHand_400Regular',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  googleButton: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(71, 137, 200, 0.24)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLoginRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 28,
  },
  socialLoginItem: {
    alignItems: 'center',
    gap: 8,
  },
  googleBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#4789c8',
    color: '#ffffff',
    fontSize: 25,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 36,
    textAlign: 'center',
  },
  googleButtonText: {
    alignSelf: 'center',
    marginTop: -8,
    color: '#4789c8',
    fontSize: 17,
    fontFamily: 'PatrickHand_400Regular',
    lineHeight: 20,
  },
  authSubmitButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#4789c8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  authSubmitText: {
    color: '#ffffff',
    fontSize: 19,
    fontFamily: 'PatrickHand_400Regular',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  buttonDisabled: {
    opacity: 0.56,
  },
  roomTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 247, 236, 0.08)',
  },
  roomTransitionBloom: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  roomTransitionGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
  },
  roomTransitionMascot: {
    position: 'relative',
    zIndex: 1,
    width: 260,
    height: 260,
    tintColor: '#ffffff',
  },
});
