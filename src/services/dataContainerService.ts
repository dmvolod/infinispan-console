class ContainerService {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public getCacheManagers(): Promise<CacheManager[]> {
    return fetch(this.endpoint + "/server/cache-managers/")
      .then(response => response.json())
      .then(names => Promise.all(names.map(name =>
        this.getCacheManager(name))));
  };

  public getCacheManager(name:string): Promise<CacheManager> {
    return fetch(this.endpoint + '/cache-managers/' + name)
      .then(response => response.json())
      .then(data => <CacheManager>{
        name: data.name,
        physical_addresses: data.physical_addresses,
        coordinator: data.coordinator,
        cluster_name: data.cluster_name,
        cache_manager_status: data.cache_manager_status,
        cluster_size: data.cluster_size,
        defined_caches: data.defined_caches,
        cache_configuration_names: data.cache_configuration_names
      });
  };
}

const dataContainerService: ContainerService = new ContainerService("http://localhost:11222/rest/v2");

export default dataContainerService;
