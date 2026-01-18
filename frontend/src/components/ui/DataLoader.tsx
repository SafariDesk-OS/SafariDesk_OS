import { RefreshCw } from "lucide-react"

const Spinner = () => {
    return (
        <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800  p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin h-12 w-12 text-green-500 mb-4" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading ...</span>
            <span className="text-sm text-gray-500 dark:text-gray-500 mt-1">Please wait while we fetch your data</span>
          </div>
        </div>
      </div>
    )
}

export default Spinner