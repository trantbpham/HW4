import React, { useCallback, useEffect ,useState } from 'react';
import assert from "assert";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  TableCaption,
  Td,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react';
import useVideoContext from '../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext';
import Video from '../../classes/Video/Video';
import { TownJoinResponse, CoveyTownInfo } from '../../classes/TownsServiceClient';
import useCoveyAppState from '../../hooks/useCoveyAppState';


interface TownSelectionProps {
  doLogin: (initData: TownJoinResponse) => Promise<boolean>
}


export default function TownSelection({ doLogin }: TownSelectionProps): JSX.Element {
  const [userNameJoin, setUserName] = useState<string>(Video.instance()?.userName || '');
  const [existingTownID, setExistingTownID] = useState<string>(Video.instance()?.coveyTownID || '');
  const { connect } = useVideoContext();
  const { apiClient } = useCoveyAppState();
  const toast = useToast();

  const [coveyTowns, setCoveyTownsList] = React.useState<CoveyTownInfo[]>([]);
  const retrieveList = useCallback(async () => {
    const response = await apiClient.listTowns(); 
    setCoveyTownsList(response.towns);
 }, [apiClient,setCoveyTownsList],)

 // user enter new friendlyName to create new town
 const [newFriendlyName, setNewFriendlyName] = useState<string>(Video.instance()?.townFriendlyName || '');
  // user choose if town is public or private 
  const [checked, setChecked] = useState(true);
  // create new room and set new Town to setNewTown
  const newTownCreated = {friendlyName: newFriendlyName, isPubliclyListed: checked,}
// get new ID for new town 

  useEffect(() => {
    retrieveList();
  }, [retrieveList])
  // 

  useEffect(() => {  
    const id = setTimeout(()=> { retrieveList() },2000) 
    return (() => {
      clearTimeout(id)
    })
  }, [retrieveList])
  

  const handleCreateNewTown = async () => {
      try {    
          if (!userNameJoin || userNameJoin.length === 0) {
            toast({
              title: 'Unable to create town',
              description: 'Please select a username before creating a town',
              status: 'error',
            });
            return;
          }
          if (newTownCreated.friendlyName.length === 0) {
            toast({
              title: 'Unable to create town',
              description: 'Please enter a town name',
              status: 'error'
            })
            return;
          } 
          
          const responseTown = await apiClient.createTown(newTownCreated); 
          const initNewTown = await Video.setup(userNameJoin, responseTown.coveyTownID);

          const joinNewtownRequest = {
            userName: userNameJoin,
            coveyTownID: responseTown.coveyTownID
          }      
      
          const loggedInNewTown = await doLogin(initNewTown);
          if (loggedInNewTown) {
            assert(initNewTown.providerVideoToken);
            await connect(initNewTown.providerVideoToken);
          }
          toast({
            title: `Town ${newTownCreated.friendlyName} is ready to go!`,
            status: 'success',
            isClosable: true,
            duration: null
          });
          apiClient.joinTown(joinNewtownRequest);
       } catch (err) {
          toast({
            title: 'Unable to connect to Towns Service',
            description: err.toString(),
            status: 'error'
          })
           await Video.teardown();
        }
  }

  // function callBackTownID() {
  //   const foundTown = coveyTowns.find(town => town.coveyTownID);
  //   return foundTown;
  // }


  // handle connect button on the room list
  const handleJoin = async (passCoveyTownID: string) => {
    try {
      // check for empty userName input
      if (!userNameJoin || userNameJoin.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please select a username',
          status: 'error',
        });
        return;
      }

      if (passCoveyTownID.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please enter a town ID',
          status: 'error',
        });
        return;
      }

      const initData = await Video.setup(userNameJoin, passCoveyTownID);

      const joinRoomRequest = {
        userName: userNameJoin,
        coveyTownID: passCoveyTownID
      }      
  
      const loggedIn = await doLogin(initData);
      if (loggedIn) {
        assert(initData.providerVideoToken);
        await connect(initData.providerVideoToken);
      }
      apiClient.joinTown(joinRoomRequest);

    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
      await Video.teardown();
    }
  }


  return (
    <>
      <form>
        <Stack>
          <Box p="4" borderWidth="1px" borderRadius="lg">
            <Heading as="h2" size="lg">Select a username</Heading>
            <FormControl>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input autoFocus name="name" placeholder="Your name"
                     value={userNameJoin}
                     onChange={event => setUserName(event.target.value)}
              />
            </FormControl>
          </Box>
          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Create a New Town</Heading>
            <Flex p="4">
              <Box flex="1">
                <FormControl>
                  <FormLabel htmlFor="townName">New Town Name</FormLabel>
                  <Input name="townName" placeholder="New Town Name"
                    value={newFriendlyName}
                    onChange={event => setNewFriendlyName(event.target.value)}
                  />
                </FormControl>
              </Box><Box>
              <FormControl>
                <FormLabel htmlFor="isPublic">Publicly Listed</FormLabel>
                <Checkbox id="isPublic" name="isPublic"  defaultChecked={checked}
        onChange={() => setChecked(!checked)}/>

              </FormControl>
            </Box>
              <Box>
                <Button onClick={handleCreateNewTown} data-testid="newTownButton">Create</Button>
              </Box>
            </Flex>
          </Box>
          <Heading p="4" as="h2" size="lg">-or-</Heading>

          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Join an Existing Town</Heading>
            <Box borderWidth="1px" borderRadius="lg">
              <Flex p="4"><FormControl>
              <FormLabel htmlFor="townIDToJoin">Town ID</FormLabel>
                <Input autoFocus name="townIDToJoin" placeholder="ID of town to join, or select from list"
                     value={existingTownID}
                     onChange={event => setExistingTownID(event.target.value)}
                     />
              </FormControl>
                <Button data-testid='joinTownByIDButton'onClick={() => handleJoin(existingTownID)} >Connect</Button>
              </Flex>
            </Box>

            <Heading p="4" as="h4" size="md">Select a public town to join</Heading>
            <Box maxH="500px" overflowY="scroll">
              <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead>
                  <Tr>
                    <Th>Town Name</Th>
                    <Th>Town ID</Th>
                    <Th>Activity</Th>
                    </Tr></Thead>
                { coveyTowns.sort((a,b) => b.currentOccupancy - a.currentOccupancy).map(town => 
                  <Tr key={`${town.coveyTownID}`}>               
                    <Td role='cell'>{town.friendlyName}</Td>
                    <Td role='cell'>{town.coveyTownID }</Td>
                    <Td role='cell'> {town.currentOccupancy
                    }/{town.maximumOccupancy} <Button onClick={() => handleJoin(town.coveyTownID)} disabled={ town.currentOccupancy >= town.maximumOccupancy}>Connect</Button></Td>
                  </Tr> 
                  )
                  }
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}
