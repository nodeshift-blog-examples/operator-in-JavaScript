import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const kc = loadKubeConfig();
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
//TODO: Don't hardcode namespace name.
const namespace = 'guillaume-ts-operator';
const deploymentTemplate = fs.readFileSync('memcached-deployment.json','utf-8');
const watch = new k8s.Watch(kc);

function onEvent(phase: string, apiObj: any, watchObj?: any) {
    log(`Received event in phase ${phase}.`);
    if (phase == 'ADDED') {
        reconcileInOneSecond(apiObj);
    } else if (phase == 'MODIFIED') {
        reconcileInOneSecond(apiObj);
    } else if (phase == 'DELETED') {

    } else {
        log(`Unknown event type: ${phase}`);
    }
}

function onDone(err: any) {
    log(`Connection closed. ${err}`);
    watchResource();
}

function loadKubeConfig(): k8s.KubeConfig {

    const kubeConfig = new k8s.KubeConfig();
    kubeConfig.loadFromDefault();
    return kubeConfig;
}

async function watchResource(): Promise<any> {
    log('Watching API');
    return watch.watch('/apis/cache.example.com/v1/memcacheds', {}, onEvent, onDone);
}

async function main() {
    await watchResource()
        .catch((req) => {
            log(`Promise rejected: ${req}`);
        })
        .then((req) => {
            log(`Promise resolved.`);
            //setTimeout(startWatch, 15 * 1000);
        })
        .finally(() => {
            log(`Promise finally.`);
        })
        ;
    log(`Finished.`);
}

function log(message: string) {
    console.log(`${new Date().toLocaleString()}: ${message}`);
}

let reconcileScheduled: boolean = false;

function reconcileInOneSecond(obj: Memcached) {
    if (!reconcileScheduled) {
        setTimeout(reconcileNow, 1000, obj);
        reconcileScheduled = true;
    }
}

async function reconcileNow(obj: Memcached) {
    reconcileScheduled = false;
    let deploymentName: string = obj.metadata.name!;
    //check if deployment exists. Create it if it doesn't.
    try {  
        const response = await k8sApi.readNamespacedDeployment(deploymentName, namespace);
        //patch the deployment
        let deployment:k8s.V1Deployment = response.body;
        deployment.metadata!.name= deploymentName;
        deployment.spec!.replicas = obj.spec.size;
        //set our resource status.

        k8sApi.replaceNamespacedDeployment(deploymentName,namespace,deployment);
    } catch(err) {
        //Create the deployment
        let newDeployment: k8s.V1Deployment = JSON.parse(deploymentTemplate);
        newDeployment.metadata!.name= deploymentName;
        newDeployment.spec!.replicas = obj.spec.size;
        k8sApi.createNamespacedDeployment(namespace,newDeployment);
    } 
    
}

interface MemcachedSpec {
    size: number;
}
interface MemcachedStatus {
    nodes: string[];
}
interface Memcached {
    apiVersion: string;
    kind: string;
    metadata: k8s.V1ObjectMeta;
    spec: MemcachedSpec;
    status: MemcachedStatus;
}

main();