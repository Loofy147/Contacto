// mobile/App.tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/config/theme';
import { initializeDatabase } from './src/services/database';
import { SplashScreen } from './src/screens/SplashScreen';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize local database (Realm)
        await initializeDatabase();
        
        // Preload fonts, images, etc.
        // await loadResourcesAsync();
        
        // Small delay for splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent
              />
              <AppNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

// ============================================================================
// mobile/src/navigation/AppNavigator.tsx
// ============================================================================
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator();

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

// ============================================================================
// mobile/src/navigation/MainTabNavigator.tsx
// ============================================================================
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Calendar, User } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconProps = { size, color };

          switch (route.name) {
            case 'Home':
              return <Home {...iconProps} />;
            case 'Search':
              return <Search {...iconProps} />;
            case 'Appointments':
              return <Calendar {...iconProps} />;
            case 'Profile':
              return <User {...iconProps} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'الرئيسية' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'بحث' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'المواعيد' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'الحساب' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// mobile/src/screens/HomeScreen.tsx
// ============================================================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchFeaturedProfessionals } from '../store/slices/professionalsSlice';
import { SearchBar } from '../components/SearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { ProfessionalCard } from '../components/ProfessionalCard';
import { RootState, AppDispatch } from '../store';

export function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories, loading: categoriesLoading } = useSelector(
    (state: RootState) => state.categories
  );
  const { featured, loading: professionalsLoading } = useSelector(
    (state: RootState) => state.professionals
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchCategories()),
      dispatch(fetchFeaturedProfessionals()),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً، {user?.firstName || 'ضيف'}!</Text>
            <Text style={styles.subtitle}>ابحث عن محترف اليوم</Text>
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            onPress={() => navigation.navigate('Search')}
            placeholder="ابحث عن خدمة أو محترف..."
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الفئات الشائعة</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.slice(0, 8).map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => navigation.navigate('ProfessionalsList', {
                  categoryId: category.id,
                  categoryName: category.nameAr,
                })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Professionals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>محترفون موصى بهم</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {featured.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              onPress={() => navigation.navigate('ProfessionalDetail', {
                id: professional.id,
              })}
              style={styles.professionalCard}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>روابط سريعة</Text>
          
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="💼"
              title="أصبح محترفاً"
              onPress={() => navigation.navigate('BecomeProfessional')}
            />
            <QuickActionButton
              icon="🎯"
              title="طلباتي"
              onPress={() => navigation.navigate('MyBookings')}
            />
            <QuickActionButton
              icon="❤️"
              title="المفضلة"
              onPress={() => navigation.navigate('Favorites')}
            />
            <QuickActionButton
              icon="💬"
              title="الدعم"
              onPress={() => navigation.navigate('Support')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionButton({ icon, title, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  notificationBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  professionalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickAction: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});