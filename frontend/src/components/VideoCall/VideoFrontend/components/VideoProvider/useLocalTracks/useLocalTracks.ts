import { useCallback, useState } from 'react';
import Video, { LocalVideoTrack, LocalAudioTrack, CreateLocalTrackOptions } from 'twilio-video';
import { useMutex } from 'react-context-mutex';
import { useHasAudioInputDevices, useHasVideoInputDevices } from '../../../hooks/deviceHooks/deviceHooks';
import { DEFAULT_VIDEO_CONSTRAINTS } from '../../../constants';
import LocalStorage_TwilioVideo from '../../../../../../classes/LocalStorage/TwilioVideo';

export default function useLocalTracks() {
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack>();
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [isAcquiringLocalTracks, setIsAcquiringLocalTracks] = useState(false);

  const hasAudio = useHasAudioInputDevices();
  const hasVideo = useHasVideoInputDevices();

  const getLocalAudioTrack = useCallback(async (deviceId?: string) => {
    const options: CreateLocalTrackOptions = {};

    if (deviceId) {
      options.deviceId = { exact: deviceId };
    }

    console.log('Running getLocalAudioTrack');

    const newTrack = await Video.createLocalAudioTrack(options);
    setAudioTrack(newTrack);
    return newTrack;
  }, []);

  const getLocalVideoTrack = useCallback((newOptions?: CreateLocalTrackOptions) => {
    const options: CreateLocalTrackOptions = {
      // ...(DEFAULT_VIDEO_CONSTRAINTS as {}),
      width: 640,
      height: 480,
      frameRate: 24,
      name: `camera-${Date.now()}`,
      ...newOptions,
    };

    return Video.createLocalVideoTrack(options).then((newTrack) => {
      setVideoTrack(newTrack);
      return newTrack;
    });
  }, []);

  const removeLocalVideoTrack = useCallback(() => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoTrack(undefined);
    }
  }, [videoTrack]);

  const removeLocalAudioTrack = useCallback(() => {
    if (audioTrack) {
      audioTrack.stop();
      setAudioTrack(undefined);
    }
  }, [audioTrack]);

  const MutexRunner = useMutex();
  const getAudioAndVideoTracksMutex = new MutexRunner('getAudioAndVideoTracks');
  const getAudioAndVideoTracks = async () => getAudioAndVideoTracksMutex.run(
    async () => {
      getAudioAndVideoTracksMutex.lock();
      try {
        if (!hasAudio && !hasVideo) return Promise.resolve();
        if (audioTrack || videoTrack) return Promise.resolve();

        console.log('Running getAudioAndVideoTracks');

        setIsAcquiringLocalTracks(true);
        const tracks = await Video.createLocalTracks({
          video: hasVideo && {
            ...(DEFAULT_VIDEO_CONSTRAINTS as {}),
            name: `camera-${Date.now()}`,
            deviceId: LocalStorage_TwilioVideo.twilioVideoLastCamera ?? undefined,
          },
          audio: hasAudio && {
            deviceId: LocalStorage_TwilioVideo.twilioVideoLastMic ?? undefined,
          },
        });

        const _videoTrack = tracks.find((track) => track.kind === 'video');
        const _audioTrack = tracks.find((track) => track.kind === 'audio');
        if (_videoTrack) {
          console.log('Running getAudioAndVideoTracks:setVideoTrack');
          setVideoTrack(_videoTrack as LocalVideoTrack);
        }
        if (_audioTrack) {
          console.log('Running getAudioAndVideoTracks:setAudioTrack');
          setAudioTrack(_audioTrack as LocalAudioTrack);
        }
      } finally {
        setIsAcquiringLocalTracks(false);
        getAudioAndVideoTracksMutex.unlock();
      }
    },
    () => {},
  );

  return {
    audioTrack,
    videoTrack,
    getLocalVideoTrack,
    getLocalAudioTrack,
    isAcquiringLocalTracks,
    removeLocalVideoTrack,
    removeLocalAudioTrack,
    getAudioAndVideoTracks,
  };
}
