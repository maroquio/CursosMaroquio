import { Center, Loader } from '@mantine/core';

export function LoadingFallback() {
  return (
    <Center h="100vh">
      <Loader size="lg" type="dots" color="indigo" />
    </Center>
  );
}

export default LoadingFallback;
