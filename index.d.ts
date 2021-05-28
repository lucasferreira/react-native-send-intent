declare namespace SendIntentAndroid {
  type TextType = typeof TEXT_HTML | typeof TEXT_PLAIN

  interface TextIntentConfig {
      title: string
      text: string
      type: TextType
  }

  interface CalendarEventConfig {
          title: string
          description: string
          /**
           * A datetime string with following format: yyyy-MM-dd HH:mm
           */
          startDate: string
          /**
           * A datetime string with following format: yyyy-MM-dd HH:mm
           */
          endDate: string
          recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          location: string
          /**
           * **default**: false
           */
          isAllDay?: boolean
  }

  interface ChooserOptions {
      subject?: string
      text?: string
      imageUrl?: string
      videoUrl?: string
  }

  interface TextToLineOptions {
      text?: string
  }

  interface FileChooserOptions {
      fileUrl: string
      subject?: string
      type: string
  }

  const sendText: (config: TextIntentConfig) => void
  const sendPhoneCall: (phoneNumber: string, phoneAppOnly?: boolean) => void
  const sendPhoneDial: (phoneNumber: string, phoneAppOnly?: boolean) => void
  const sendSms: (phoneNumber: string, body?: string|null) => void
  const addCalendarEvent: (config: CalendarEventConfig) => void
  const isAppInstalled: (packageName: string) => Promise<boolean>
  const installRemoteApp: (uri: string, saveAs: string) => Promise<boolean>
  const openCalendar: () => void
  const sendMail: (recepientMail: string, subject?: string, body?: string) => void
  const openChooserWithOptions: (options: ChooserOptions, title: string) => void
  const openChooserWithMultipleOptions: (options: ChooserOptions[], title: string) => void
  const openMaps: (query: string) => void
  const openCamera: () => void
  const openMapsWithRoute: (query: string, mode: string)=> void
  const shareTextToLine: (options: TextToLineOptions)=> void
  const shareImageToInstagram: (mimeType: string, mediaPath: string) => void
  const openSettings: (settingsName: string) => void
  const getVoiceMailNumber: () => Promise<string>
  const getPhoneNumber: () => Promise<string>
  const gotoHomeScreen: () => void
  const openApp: (packageName: string, extras: { [index: string]: string }) => Promise<boolean>
  const openAppWithData: (packageName: string, dataUri: string, mimeType?: string, extras?: { [index: string]: string }) => Promise<boolean>
  const openChromeIntent: (dataUri: string) => Promise<boolean>
  const openDownloadManager: () => void
  const openFileChooser: (options: FileChooserOptions, title: string) => void
  const openEmailApp: () => void
  const openAllEmailApp: () => void
  const requestIgnoreBatteryOptimizations: () => Promise<boolean>
  const showIgnoreBatteryOptimizationsSettings: () => void
  const openAppWithUri: (intentUri: string, extras?: { [index: string]: string }) => Promise<boolean>
  const TEXT_PLAIN: unique symbol
  const TEXT_HTML: unique symbol
}

export = SendIntentAndroid
