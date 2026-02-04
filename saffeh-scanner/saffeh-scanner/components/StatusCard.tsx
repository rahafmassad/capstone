import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { ThemedText } from './ThemedText';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface StatusCardProps {
  type: StatusType;
  title: string;
  message?: string;
  details?: { label: string; value: string }[];
  visible: boolean;
}

export function StatusCard({ type, title, message, details, visible }: StatusCardProps) {
  const theme = useTheme();

  if (!visible) return null;

  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          backgroundColor: theme.successLight,
          iconColor: theme.success,
          borderColor: theme.success,
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          backgroundColor: theme.errorLight,
          iconColor: theme.error,
          borderColor: theme.error,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          backgroundColor: '#FFF3CD',
          iconColor: theme.warning,
          borderColor: theme.warning,
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          backgroundColor: '#D1ECF1',
          iconColor: theme.secondary,
          borderColor: theme.secondary,
        };
      case 'loading':
        return {
          icon: 'sync' as const,
          backgroundColor: '#E8F4FD',
          iconColor: theme.primary,
          borderColor: theme.primary,
        };
      default:
        return {
          icon: 'information-circle' as const,
          backgroundColor: theme.surface,
          iconColor: theme.text,
          borderColor: theme.border,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name={config.icon} size={32} color={config.iconColor} />
        <View style={styles.titleContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.title, { color: config.iconColor }]}>
            {title}
          </ThemedText>
          {message && (
            <ThemedText style={styles.message} lightColor="#4A5568" darkColor="#A0AEC0">
              {message}
            </ThemedText>
          )}
        </View>
      </View>

      {details && details.length > 0 && (
        <View style={styles.detailsContainer}>
          {details.map((detail, index) => (
            <View key={index} style={styles.detailRow}>
              <ThemedText style={styles.detailLabel} lightColor="#6B7C93" darkColor="#9CA3AF">
                {detail.label}:
              </ThemedText>
              <ThemedText style={styles.detailValue} lightColor="#1E3A5F" darkColor="#F5F7FA">
                {detail.value}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
